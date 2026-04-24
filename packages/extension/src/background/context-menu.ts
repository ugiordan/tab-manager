import { snoozeTab, queueTab } from "./lifecycle-manager.js";
import { DEFAULT_EXTENSION_CONFIG, isAllowedUrl } from "../types.js";

export async function setupContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "snooze-parent",
    title: "Snooze tab",
    contexts: ["page"],
  });
  chrome.contextMenus.create({ id: "snooze-1h", parentId: "snooze-parent", title: "1 hour", contexts: ["page"] });
  chrome.contextMenus.create({ id: "snooze-2h", parentId: "snooze-parent", title: "2 hours", contexts: ["page"] });
  chrome.contextMenus.create({ id: "snooze-tomorrow", parentId: "snooze-parent", title: "Tomorrow 9am", contexts: ["page"] });
  chrome.contextMenus.create({ id: "snooze-monday", parentId: "snooze-parent", title: "Next Monday 9am", contexts: ["page"] });

  chrome.contextMenus.create({
    id: "queue-tab",
    title: "Queue tab for later",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "watch-tab",
    title: "Watch tab for changes...",
    contexts: ["page"],
  });
}

function getSnoozeWakeTime(menuItemId: string): number {
  const now = Date.now();
  switch (menuItemId) {
    case "snooze-1h": return now + 60 * 60 * 1000;
    case "snooze-2h": return now + 2 * 60 * 60 * 1000;
    case "snooze-tomorrow": {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.getTime();
    }
    case "snooze-monday": {
      const monday = new Date();
      const dayOfWeek = monday.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      monday.setDate(monday.getDate() + daysUntilMonday);
      monday.setHours(9, 0, 0, 0);
      return monday.getTime();
    }
    default: return now + 60 * 60 * 1000;
  }
}

export function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): void {
  if (!tab?.id || !tab.url || !tab.title || !isAllowedUrl(tab.url)) return;

  const menuId = info.menuItemId as string;

  if (menuId.startsWith("snooze-")) {
    const wakeAt = getSnoozeWakeTime(menuId);
    snoozeTab(tab.url, tab.title, tab.favIconUrl, tab.windowId, wakeAt).then(() => {
      chrome.tabs.remove(tab.id!);
    }).catch((err) => console.error("Snooze failed:", err));
  } else if (menuId === "queue-tab") {
    queueTab(tab.url, tab.title, tab.favIconUrl, tab.windowId).then(() => {
      chrome.tabs.remove(tab.id!);
    }).catch((err) => console.error("Queue failed:", err));
  } else if (menuId === "watch-tab") {
    // Inject element selector content script
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ["content/element-selector.js"],
    }).catch((err) => console.error("Script injection failed:", err));
  }
}
