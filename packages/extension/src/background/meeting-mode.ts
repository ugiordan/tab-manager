import { bulkSnooze, bulkWakeByMeetingId } from "./lifecycle-manager.js";
import { updateBadge } from "./badge-manager.js";
import { DEFAULT_EXTENSION_CONFIG, isAllowedUrl } from "../types.js";

export async function activateMeetingMode(): Promise<{ meetingId: string; closedCount: number }> {
  const meetingId = `meeting-${Date.now()}`;
  const allTabs = await chrome.tabs.query({ pinned: false });
  const tabData = allTabs
    .filter((t) => t.id && t.url && isAllowedUrl(t.url))
    .map((t) => ({ url: t.url!, title: t.title ?? "", favIconUrl: t.favIconUrl, windowId: t.windowId }));

  await bulkSnooze(tabData, meetingId);

  // Create a blank tab in each affected window so closing all tabs doesn't close the window
  const windowIds = new Set(allTabs.map((t) => t.windowId));
  const placeholderTabIds: number[] = [];
  for (const windowId of windowIds) {
    const placeholder = await chrome.tabs.create({ windowId, url: "chrome://newtab", active: true });
    if (placeholder.id) placeholderTabIds.push(placeholder.id);
  }

  // Close only the tabs that were actually snoozed, not all non-pinned tabs
  const snoozedTabIds = allTabs
    .filter((t) => t.id && t.url && isAllowedUrl(t.url))
    .map((t) => t.id!)
    .filter(Boolean);
  if (snoozedTabIds.length > 0) await chrome.tabs.remove(snoozedTabIds);

  // Update badge
  const remaining = await chrome.tabs.query({});
  const stored = await chrome.storage.local.get("config");
  const config = stored.config ?? DEFAULT_EXTENSION_CONFIG;
  await updateBadge(remaining.length, config);

  await chrome.storage.local.set({ meetingMode: { active: true, meetingId, placeholderTabIds } });
  return { meetingId, closedCount: snoozedTabIds.length };
}

export async function deactivateMeetingMode(): Promise<{ restoredCount: number }> {
  const stored = await chrome.storage.local.get("meetingMode");
  const meetingId = stored.meetingMode?.meetingId;
  if (!meetingId) return { restoredCount: 0 };

  const placeholderTabIds: number[] = stored.meetingMode?.placeholderTabIds ?? [];
  const woken = await bulkWakeByMeetingId(meetingId);

  // Reopen all tabs (fall back if original window no longer exists)
  for (const tab of woken) {
    if (!isAllowedUrl(tab.url)) continue;
    try {
      await chrome.tabs.create({ url: tab.url, windowId: tab.originWindowId });
    } catch {
      await chrome.tabs.create({ url: tab.url });
    }
  }

  // Close the placeholder tabs that were keeping windows alive
  for (const tabId of placeholderTabIds) {
    try { await chrome.tabs.remove(tabId); } catch { /* tab may already be closed */ }
  }

  await chrome.storage.local.set({ meetingMode: { active: false, meetingId: null, placeholderTabIds: [] } });
  return { restoredCount: woken.length };
}
