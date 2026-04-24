import { describe, it, expect, beforeEach } from "vitest";
import { resetChromeStorage, getStorageData, getAlarms } from "./setup.js";
import {
  snoozeTab, queueTab, watchTab, wakeTab, removeTab,
  getNextQueuedTab, wakeNextQueued, listByState, updateWatchStatus,
  bulkSnooze, bulkWakeByMeetingId, reorderQueue,
} from "../src/background/lifecycle-manager.js";

beforeEach(() => {
  resetChromeStorage();
});

describe("snoozeTab", () => {
  it("creates a snoozed tab in storage and registers an alarm", async () => {
    const tab = await snoozeTab("https://example.com", "Example", undefined, 1, 9999999);
    expect(tab.state).toBe("snoozed");
    expect(tab.url).toBe("https://example.com");
    expect(tab.wakeAt).toBe(9999999);

    const stored = getStorageData().lifecycle;
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(tab.id);

    const alarms = getAlarms();
    expect(alarms[`snooze-${tab.id}`]).toEqual({ when: 9999999 });
  });

  it("attaches meetingId when provided", async () => {
    const tab = await snoozeTab("https://example.com", "Ex", undefined, 1, 0, "meeting-123");
    expect(tab.meetingId).toBe("meeting-123");
  });
});

describe("queueTab", () => {
  it("creates a queued tab with position 0", async () => {
    const tab = await queueTab("https://example.com", "Example", undefined, 1);
    expect(tab.state).toBe("queued");
    expect(tab.position).toBe(0);
  });

  it("increments position for subsequent queued tabs", async () => {
    await queueTab("https://a.com", "A", undefined, 1);
    const tab2 = await queueTab("https://b.com", "B", undefined, 1);
    expect(tab2.position).toBe(1);
  });
});

describe("watchTab", () => {
  it("creates a watching tab with cssSelector", async () => {
    const tab = await watchTab("https://example.com", "Example", undefined, 1, "#main", 15);
    expect(tab.state).toBe("watching");
    expect(tab.cssSelector).toBe("#main");
    expect(tab.pollIntervalMinutes).toBe(15);
    expect(tab.changedAt).toBeNull();
  });

  it("defaults pollIntervalMinutes to 30", async () => {
    const tab = await watchTab("https://example.com", "Example", undefined, 1, ".content");
    expect(tab.pollIntervalMinutes).toBe(30);
  });
});

describe("wakeTab", () => {
  it("removes a tab from storage and returns it", async () => {
    const tab = await snoozeTab("https://example.com", "Ex", undefined, 1, 9999);
    const woken = await wakeTab(tab.id);
    expect(woken).not.toBeNull();
    expect(woken!.id).toBe(tab.id);

    const stored = getStorageData().lifecycle;
    expect(stored).toHaveLength(0);
  });

  it("clears the alarm for snoozed tabs", async () => {
    const tab = await snoozeTab("https://example.com", "Ex", undefined, 1, 9999);
    expect(getAlarms()[`snooze-${tab.id}`]).toBeDefined();

    await wakeTab(tab.id);
    expect(getAlarms()[`snooze-${tab.id}`]).toBeUndefined();
  });

  it("returns null for non-existent id", async () => {
    const result = await wakeTab("nonexistent");
    expect(result).toBeNull();
  });
});

describe("removeTab", () => {
  it("removes a tab and clears its alarm", async () => {
    const tab = await snoozeTab("https://example.com", "Ex", undefined, 1, 9999);
    const removed = await removeTab(tab.id);
    expect(removed).toBe(true);
    expect(getStorageData().lifecycle).toHaveLength(0);
    expect(getAlarms()[`snooze-${tab.id}`]).toBeUndefined();
  });

  it("returns false for non-existent id", async () => {
    expect(await removeTab("nonexistent")).toBe(false);
  });
});

describe("getNextQueuedTab", () => {
  it("returns the tab with the lowest position", async () => {
    await queueTab("https://a.com", "A", undefined, 1);
    await queueTab("https://b.com", "B", undefined, 1);
    const next = await getNextQueuedTab();
    expect(next).not.toBeNull();
    expect(next!.url).toBe("https://a.com");
    expect(next!.position).toBe(0);
  });

  it("returns null when queue is empty", async () => {
    expect(await getNextQueuedTab()).toBeNull();
  });
});

describe("wakeNextQueued", () => {
  it("atomically removes and returns the next queued tab", async () => {
    await queueTab("https://a.com", "A", undefined, 1);
    await queueTab("https://b.com", "B", undefined, 1);
    const next = await wakeNextQueued();
    expect(next).not.toBeNull();
    expect(next!.url).toBe("https://a.com");

    // Tab should be removed from storage
    const stored = getStorageData().lifecycle;
    expect(stored).toHaveLength(1);
    expect(stored[0].url).toBe("https://b.com");
  });

  it("returns null when queue is empty", async () => {
    expect(await wakeNextQueued()).toBeNull();
  });

  it("does not remove non-queued tabs", async () => {
    await snoozeTab("https://a.com", "A", undefined, 1, 9999);
    const next = await wakeNextQueued();
    expect(next).toBeNull();
    expect(getStorageData().lifecycle).toHaveLength(1);
  });
});

describe("listByState", () => {
  it("returns all tabs when no state filter", async () => {
    await snoozeTab("https://a.com", "A", undefined, 1, 9999);
    await queueTab("https://b.com", "B", undefined, 1);
    const all = await listByState();
    expect(all).toHaveLength(2);
  });

  it("filters by state", async () => {
    await snoozeTab("https://a.com", "A", undefined, 1, 9999);
    await queueTab("https://b.com", "B", undefined, 1);
    expect(await listByState("snoozed")).toHaveLength(1);
    expect(await listByState("queued")).toHaveLength(1);
    expect(await listByState("watching")).toHaveLength(0);
  });
});

describe("updateWatchStatus", () => {
  it("updates lastCheckedAt and lastContentHash", async () => {
    const tab = await watchTab("https://example.com", "Ex", undefined, 1, "#main");
    await updateWatchStatus(tab.id, "abc123", false);

    const stored = getStorageData().lifecycle[0];
    expect(stored.lastContentHash).toBe("abc123");
    expect(stored.lastCheckedAt).toBeGreaterThan(0);
    expect(stored.changedAt).toBeNull();
  });

  it("sets changedAt when changed is true", async () => {
    const tab = await watchTab("https://example.com", "Ex", undefined, 1, "#main");
    await updateWatchStatus(tab.id, "abc123", true);

    const stored = getStorageData().lifecycle[0];
    expect(stored.changedAt).toBeGreaterThan(0);
  });

  it("ignores non-watching tabs", async () => {
    const tab = await snoozeTab("https://example.com", "Ex", undefined, 1, 9999);
    await updateWatchStatus(tab.id, "abc123", true);
    const stored = getStorageData().lifecycle[0];
    expect(stored.lastContentHash).toBeUndefined();
  });
});

describe("bulkSnooze", () => {
  it("snoozes multiple tabs in a single storage write", async () => {
    const tabs = [
      { url: "https://a.com", title: "A", windowId: 1 },
      { url: "https://b.com", title: "B", windowId: 1 },
      { url: "https://c.com", title: "C", windowId: 2 },
    ];
    const snoozed = await bulkSnooze(tabs, "meeting-1");

    expect(snoozed).toHaveLength(3);
    expect(snoozed.every((t) => t.meetingId === "meeting-1")).toBe(true);
    expect(getStorageData().lifecycle).toHaveLength(3);
    // Meeting-mode tabs should NOT create alarms (they wake via deactivateMeetingMode)
    expect(Object.keys(getAlarms())).toHaveLength(0);
  });
});

describe("bulkWakeByMeetingId", () => {
  it("wakes all tabs with matching meetingId", async () => {
    await bulkSnooze(
      [
        { url: "https://a.com", title: "A", windowId: 1 },
        { url: "https://b.com", title: "B", windowId: 1 },
      ],
      "meeting-1"
    );
    await snoozeTab("https://c.com", "C", undefined, 1, 9999); // no meetingId

    const woken = await bulkWakeByMeetingId("meeting-1");
    expect(woken).toHaveLength(2);
    expect(getStorageData().lifecycle).toHaveLength(1);
    expect(getStorageData().lifecycle[0].url).toBe("https://c.com");
  });
});

describe("reorderQueue", () => {
  it("updates positions based on provided order", async () => {
    const a = await queueTab("https://a.com", "A", undefined, 1);
    const b = await queueTab("https://b.com", "B", undefined, 1);
    const c = await queueTab("https://c.com", "C", undefined, 1);

    await reorderQueue([c.id, a.id, b.id]);

    const stored = getStorageData().lifecycle;
    expect(stored.find((t: any) => t.id === c.id).position).toBe(0);
    expect(stored.find((t: any) => t.id === a.id).position).toBe(1);
    expect(stored.find((t: any) => t.id === b.id).position).toBe(2);
  });
});
