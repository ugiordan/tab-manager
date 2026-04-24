import { TrackedTab } from "../types.js";

const tabStore = new Map<number, TrackedTab>();

export async function getAllTrackedTabs(): Promise<TrackedTab[]> {
  const tabs = await chrome.tabs.query({});
  const tracked: TrackedTab[] = [];
  for (const tab of tabs) {
    if (!tab.id) continue;
    const existing = tabStore.get(tab.id);
    const trackedTab: TrackedTab = {
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url ?? "",
      title: tab.title ?? "",
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned ?? false,
      groupId: tab.groupId ?? -1,
      index: tab.index,
      lastAccessed: existing?.lastAccessed ?? Date.now(),
      createdAt: existing?.createdAt ?? Date.now(),
    };
    tabStore.set(tab.id, trackedTab);
    tracked.push(trackedTab);
  }
  return tracked;
}

export function onTabActivated(tabId: number): void {
  const tab = tabStore.get(tabId);
  if (tab) {
    tab.lastAccessed = Date.now();
    tabStore.set(tabId, tab);
  }
}

export function onTabCreated(tabId: number): void {
  chrome.tabs.get(tabId).then((tab) => {
    if (!tab.id) return;
    const trackedTab: TrackedTab = {
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url ?? "",
      title: tab.title ?? "",
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned ?? false,
      groupId: tab.groupId ?? -1,
      index: tab.index,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
    };
    tabStore.set(tab.id, trackedTab);
  });
}

export function onTabRemoved(tabId: number): void {
  tabStore.delete(tabId);
}
