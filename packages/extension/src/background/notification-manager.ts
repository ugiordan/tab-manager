import type { LifecycleTab } from "../types.js";

export async function notifySnoozeWake(tab: LifecycleTab): Promise<void> {
  await chrome.notifications.create(`snooze-wake-${tab.id}`, {
    type: "basic",
    iconUrl: tab.favIconUrl || "icons/icon48.png",
    title: "Tab Woke Up",
    message: `"${tab.title}" is back. It was snoozed and just reopened.`,
  });
}

export async function notifyWatchChange(tab: LifecycleTab): Promise<void> {
  await chrome.notifications.create(`watch-change-${tab.id}`, {
    type: "basic",
    iconUrl: tab.favIconUrl || "icons/icon48.png",
    title: "Watched Page Changed",
    message: `"${tab.title}" has new content on the element you're watching.`,
  });
}
