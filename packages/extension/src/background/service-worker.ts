import { onTabActivated, onTabCreated, onTabRemoved, getAllTrackedTabs } from "./tab-tracker.js";
import { updateBadge } from "./badge-manager.js";
import { setupAlarms, handleAlarm } from "./alarm-handler.js";
import { connectWebSocket } from "./bridge-client.js";
import { setupContextMenus, handleContextMenuClick } from "./context-menu.js";
import { activateMeetingMode, deactivateMeetingMode } from "./meeting-mode.js";
import { wakeTab, getNextQueuedTab, listByState, watchTab, reorderQueue, removeTab, snoozeTab, queueTab } from "./lifecycle-manager.js";
import { clearAttention } from "./badge-manager.js";
import { DEFAULT_EXTENSION_CONFIG, isAllowedUrl } from "../types.js";

// Tab tracking
chrome.tabs.onActivated.addListener((info) => { onTabActivated(info.tabId); });
chrome.tabs.onCreated.addListener((tab) => { if (tab.id) onTabCreated(tab.id); updateBadgeCount(); });
chrome.tabs.onRemoved.addListener((tabId) => { onTabRemoved(tabId); updateBadgeCount(); });

// Alarms
chrome.alarms.onAlarm.addListener(handleAlarm);

// Context menus
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Lifecycle events
chrome.runtime.onInstalled.addListener(() => {
  setupAlarms();
  setupContextMenus();
  updateBadgeCount();
  connectWebSocket();
  checkOverdueSnoozes();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarms();
  setupContextMenus();
  updateBadgeCount();
  connectWebSocket();
  checkOverdueSnoozes();
});

// Notification click handlers
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId.startsWith("watch-change-")) {
    const lifecycleId = notificationId.replace("watch-change-", "");
    const tab = await wakeTab(lifecycleId);
    if (tab && isAllowedUrl(tab.url)) {
      await chrome.tabs.create({ url: tab.url });
    }
  }
  chrome.notifications.clear(notificationId);
});

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TABS") {
    getAllTrackedTabs().then((tabs) => sendResponse({ tabs })).catch(() => sendResponse({ tabs: [] }));
    return true;
  }
  if (message.type === "GET_CONFIG") {
    chrome.storage.local.get("config").then((stored) => {
      sendResponse({ config: stored.config ?? DEFAULT_EXTENSION_CONFIG });
    }).catch(() => sendResponse({ config: DEFAULT_EXTENSION_CONFIG }));
    return true;
  }
  if (message.type === "GET_LIFECYCLE") {
    listByState(message.state).then((tabs) => sendResponse({ tabs })).catch(() => sendResponse({ tabs: [] }));
    return true;
  }
  if (message.type === "MEETING_MODE") {
    activateMeetingMode().then((result) => sendResponse(result)).catch(() => sendResponse({ meetingId: null, closedCount: 0 }));
    return true;
  }
  if (message.type === "END_MEETING") {
    deactivateMeetingMode().then((result) => sendResponse(result)).catch(() => sendResponse({ restoredCount: 0 }));
    return true;
  }
  if (message.type === "QUEUE_NEXT") {
    getNextQueuedTab().then(async (tab) => {
      if (tab && isAllowedUrl(tab.url)) {
        await wakeTab(tab.id);
        await chrome.tabs.create({ url: tab.url });
        sendResponse({ opened: true, tab });
      } else {
        sendResponse({ opened: false });
      }
    }).catch(() => sendResponse({ opened: false }));
    return true;
  }
  if (message.type === "WAKE_TAB") {
    wakeTab(message.lifecycleId).then(async (tab) => {
      if (tab && isAllowedUrl(tab.url)) {
        try {
          await chrome.tabs.create({ url: tab.url, windowId: tab.originWindowId });
        } catch {
          await chrome.tabs.create({ url: tab.url });
        }
        sendResponse({ woken: true, tab });
      } else {
        sendResponse({ woken: false });
      }
    }).catch(() => sendResponse({ woken: false }));
    return true;
  }
  if (message.type === "REMOVE_TAB") {
    removeTab(message.lifecycleId).then((removed) => sendResponse({ removed })).catch(() => sendResponse({ removed: false }));
    return true;
  }
  if (message.type === "REORDER_QUEUE") {
    reorderQueue(message.orderedIds).then(() => sendResponse({ done: true })).catch(() => sendResponse({ done: false }));
    return true;
  }
  if (message.type === "CLEAR_ATTENTION") {
    clearAttention().then(() => sendResponse({ cleared: true })).catch(() => sendResponse({ cleared: false }));
    return true;
  }
  if (message.type === "WATCH_ELEMENT_SELECTED") {
    // From content script: element was selected for watching
    const { selector, url, title, favIconUrl } = message;
    watchTab(url, title, favIconUrl, sender.tab?.windowId ?? 0, selector).then(async () => {
      if (sender.tab?.id) {
        await chrome.tabs.remove(sender.tab.id);
      }
      sendResponse({ watching: true });
    }).catch(() => sendResponse({ watching: false }));
    return true;
  }
  if (message.type === "SNOOZE_FROM_POPUP") {
    const { tabId, url, title, favIconUrl, windowId, wakeAt } = message;
    snoozeTab(url, title, favIconUrl, windowId, wakeAt).then(async () => {
      await chrome.tabs.remove(tabId);
      sendResponse({ snoozed: true });
    }).catch(() => sendResponse({ snoozed: false }));
    return true;
  }
  if (message.type === "QUEUE_FROM_POPUP") {
    const { tabId, url, title, favIconUrl, windowId } = message;
    queueTab(url, title, favIconUrl, windowId).then(async () => {
      await chrome.tabs.remove(tabId);
      sendResponse({ queued: true });
    }).catch(() => sendResponse({ queued: false }));
    return true;
  }
});

async function updateBadgeCount(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const stored = await chrome.storage.local.get("config");
  const config = stored.config ?? DEFAULT_EXTENSION_CONFIG;
  await updateBadge(tabs.length, config);
}

async function checkOverdueSnoozes(): Promise<void> {
  const snoozed = await listByState("snoozed");
  const now = Date.now();
  for (const tab of snoozed) {
    if (tab.wakeAt && tab.wakeAt <= now && !tab.meetingId) {
      const woken = await wakeTab(tab.id);
      if (woken && isAllowedUrl(woken.url)) {
        try {
          await chrome.tabs.create({ url: woken.url, windowId: woken.originWindowId });
        } catch {
          await chrome.tabs.create({ url: woken.url });
        }
      }
    }
  }
}
