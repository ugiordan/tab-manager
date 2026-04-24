import { getAllTrackedTabs } from "./tab-tracker.js";
import { sendTabsUpdate, isBridgeAvailable, sendLifecycleSync } from "./bridge-client.js";
import { updateBadge } from "./badge-manager.js";
import { wakeTab, listByState } from "./lifecycle-manager.js";
import { pollWatchedTabs } from "./watch-poller.js";
import { notifySnoozeWake, notifyWatchChange } from "./notification-manager.js";
import { DEFAULT_EXTENSION_CONFIG, isAllowedUrl } from "../types.js";

const MAX_ATTENTION_ITEMS = 50;

export function setupAlarms(): void {
  chrome.alarms.create("tabSync", { periodInMinutes: 1 });
  chrome.alarms.create("watchPoll", { periodInMinutes: 5 });
}

export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  // Snooze wake-up alarm
  if (alarm.name.startsWith("snooze-")) {
    const lifecycleId = alarm.name.replace("snooze-", "");
    const tab = await wakeTab(lifecycleId);
    if (tab && isAllowedUrl(tab.url)) {
      try {
        await chrome.tabs.create({ url: tab.url, windowId: tab.originWindowId });
      } catch {
        await chrome.tabs.create({ url: tab.url });
      }
      await notifySnoozeWake(tab);
      const stored = await chrome.storage.local.get("attention");
      const attention = stored.attention ?? { snoozesWoken: [], watchesChanged: [] };
      attention.snoozesWoken.push(tab.id);
      attention.snoozesWoken = attention.snoozesWoken.slice(-MAX_ATTENTION_ITEMS);
      await chrome.storage.local.set({ attention });
    }
    return;
  }

  if (alarm.name === "tabSync") {
    const tabs = await getAllTrackedTabs();
    const stored = await chrome.storage.local.get("config");
    const config = stored.config ?? DEFAULT_EXTENSION_CONFIG;
    await updateBadge(tabs.length, config);

    if (await isBridgeAvailable()) {
      await sendTabsUpdate(tabs);
      const lifecycleTabs = await listByState();
      await sendLifecycleSync(tabs, lifecycleTabs);
    }
  }

  if (alarm.name === "watchPoll") {
    const results = await pollWatchedTabs();
    for (const r of results) {
      if (r.changed) {
        const watching = await listByState("watching");
        const tab = watching.find((t) => t.id === r.tabId);
        if (tab) {
          await notifyWatchChange(tab);
          const stored = await chrome.storage.local.get("attention");
          const attention = stored.attention ?? { snoozesWoken: [], watchesChanged: [] };
          attention.watchesChanged.push(tab.id);
          attention.watchesChanged = attention.watchesChanged.slice(-MAX_ATTENTION_ITEMS);
          await chrome.storage.local.set({ attention });
        }
      }
    }
  }
}
