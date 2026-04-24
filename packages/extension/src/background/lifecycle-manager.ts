import { LifecycleTab, LifecycleState, DEFAULT_STORED_STATE } from "../types.js";

function generateId(): string {
  return crypto.randomUUID();
}

// Mutex to prevent concurrent read-modify-write races within a single
// service worker lifetime. Note: this resets when the MV3 service worker
// terminates and restarts. The practical risk is low because
// chrome.storage.local.set is itself atomic for individual operations,
// and the mutex only guards read-modify-write sequences within one session.
let mutexPromise: Promise<void> = Promise.resolve();

async function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const prev = mutexPromise;
  mutexPromise = new Promise<void>((resolve) => { release = resolve; });
  await prev;
  try {
    return await fn();
  } finally {
    release!();
  }
}

async function getLifecycleTabs(): Promise<LifecycleTab[]> {
  const stored = await chrome.storage.local.get("lifecycle");
  return stored.lifecycle ?? [];
}

async function saveLifecycleTabs(tabs: LifecycleTab[]): Promise<void> {
  await chrome.storage.local.set({ lifecycle: tabs });
}

export async function snoozeTab(
  url: string, title: string, favIconUrl: string | undefined,
  originWindowId: number, wakeAt: number, meetingId?: string
): Promise<LifecycleTab> {
  return withMutex(async () => {
    const tab: LifecycleTab = {
      id: generateId(), url, title, favIconUrl,
      state: "snoozed", createdAt: Date.now(), originWindowId, wakeAt, meetingId,
    };
    const tabs = await getLifecycleTabs();
    tabs.push(tab);
    await saveLifecycleTabs(tabs);
    await chrome.alarms.create(`snooze-${tab.id}`, { when: wakeAt });
    return tab;
  });
}

export async function queueTab(
  url: string, title: string, favIconUrl: string | undefined, originWindowId: number
): Promise<LifecycleTab> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const queued = tabs.filter((t) => t.state === "queued");
    const maxPos = queued.reduce((max, t) => Math.max(max, t.position ?? -1), -1);
    const tab: LifecycleTab = {
      id: generateId(), url, title, favIconUrl,
      state: "queued", createdAt: Date.now(), originWindowId, position: maxPos + 1,
    };
    tabs.push(tab);
    await saveLifecycleTabs(tabs);
    return tab;
  });
}

export async function watchTab(
  url: string, title: string, favIconUrl: string | undefined,
  originWindowId: number, cssSelector: string, pollIntervalMinutes: number = 30
): Promise<LifecycleTab> {
  return withMutex(async () => {
    const tab: LifecycleTab = {
      id: generateId(), url, title, favIconUrl,
      state: "watching", createdAt: Date.now(), originWindowId,
      cssSelector, pollIntervalMinutes, changedAt: null,
    };
    const tabs = await getLifecycleTabs();
    tabs.push(tab);
    await saveLifecycleTabs(tabs);
    return tab;
  });
}

export async function wakeTab(lifecycleId: string): Promise<LifecycleTab | null> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const idx = tabs.findIndex((t) => t.id === lifecycleId);
    if (idx < 0) return null;
    const [tab] = tabs.splice(idx, 1);
    await saveLifecycleTabs(tabs);
    if (tab.state === "snoozed") {
      await chrome.alarms.clear(`snooze-${tab.id}`);
    }
    return tab;
  });
}

export async function removeTab(lifecycleId: string): Promise<boolean> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const filtered = tabs.filter((t) => t.id !== lifecycleId);
    if (filtered.length === tabs.length) return false;
    await saveLifecycleTabs(filtered);
    await chrome.alarms.clear(`snooze-${lifecycleId}`);
    return true;
  });
}

export async function getNextQueuedTab(): Promise<LifecycleTab | null> {
  const tabs = await getLifecycleTabs();
  const queued = tabs.filter((t) => t.state === "queued").sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return queued[0] ?? null;
}

export async function wakeNextQueued(): Promise<LifecycleTab | null> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const queued = tabs.filter((t) => t.state === "queued").sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (queued.length === 0) return null;
    const target = queued[0];
    const idx = tabs.findIndex((t) => t.id === target.id);
    if (idx < 0) return null;
    tabs.splice(idx, 1);
    await saveLifecycleTabs(tabs);
    return target;
  });
}

export async function listByState(state?: LifecycleState): Promise<LifecycleTab[]> {
  const tabs = await getLifecycleTabs();
  if (state) return tabs.filter((t) => t.state === state);
  return tabs;
}

export async function updateWatchStatus(lifecycleId: string, contentHash: string, changed: boolean): Promise<void> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const tab = tabs.find((t) => t.id === lifecycleId);
    if (!tab || tab.state !== "watching") return;
    tab.lastCheckedAt = Date.now();
    tab.lastContentHash = contentHash;
    if (changed) tab.changedAt = Date.now();
    await saveLifecycleTabs(tabs);
  });
}

export async function bulkSnooze(
  activeTabs: { url: string; title: string; favIconUrl?: string; windowId: number }[],
  meetingId: string
): Promise<LifecycleTab[]> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const snoozed: LifecycleTab[] = [];
    for (const t of activeTabs) {
      const tab: LifecycleTab = {
        id: generateId(), url: t.url, title: t.title, favIconUrl: t.favIconUrl,
        state: "snoozed", createdAt: Date.now(), originWindowId: t.windowId,
        wakeAt: 0, meetingId,
      };
      tabs.push(tab);
      snoozed.push(tab);
    }
    await saveLifecycleTabs(tabs);
    // No alarms for meeting-mode tabs: they wake via deactivateMeetingMode
    return snoozed;
  });
}

export async function bulkWakeByMeetingId(meetingId: string): Promise<LifecycleTab[]> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const toWake = tabs.filter((t) => t.meetingId === meetingId);
    const remaining = tabs.filter((t) => t.meetingId !== meetingId);
    await saveLifecycleTabs(remaining);
    for (const t of toWake) {
      await chrome.alarms.clear(`snooze-${t.id}`);
    }
    return toWake;
  });
}

export async function reorderQueue(orderedIds: string[]): Promise<void> {
  return withMutex(async () => {
    const tabs = await getLifecycleTabs();
    const orderedSet = new Set(orderedIds);
    // Set positions for ordered IDs
    for (let i = 0; i < orderedIds.length; i++) {
      const tab = tabs.find((t) => t.id === orderedIds[i]);
      if (tab && tab.state === "queued") tab.position = i;
    }
    // Compact unordered queued tabs after the ordered ones
    let nextPos = orderedIds.length;
    for (const tab of tabs) {
      if (tab.state === "queued" && !orderedSet.has(tab.id)) {
        tab.position = nextPos++;
      }
    }
    await saveLifecycleTabs(tabs);
  });
}
