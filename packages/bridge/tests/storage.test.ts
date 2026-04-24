import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Storage } from "../src/storage.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { LifecycleTab, ActiveTab } from "../src/types.js";

function makeLifecycleTab(overrides: Partial<LifecycleTab> = {}): LifecycleTab {
  return {
    id: "test-uuid-1",
    url: "https://example.com",
    title: "Example",
    state: "snoozed",
    createdAt: Date.now(),
    originWindowId: 1,
    ...overrides,
  };
}

function makeActiveTab(overrides: Partial<ActiveTab> = {}): ActiveTab {
  return {
    id: 1,
    windowId: 1,
    url: "https://example.com",
    title: "Example",
    pinned: false,
    index: 0,
    lastAccessed: Date.now(),
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("Storage", () => {
  let storage: Storage;
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    storage = new Storage(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe("config", () => {
    it("returns default config when no config file exists", () => {
      const config = storage.getConfig();
      expect(config.thresholds.warning).toBe(30);
      expect(config.thresholds.alert).toBe(50);
      expect(config.defaultPollIntervalMinutes).toBe(30);
    });

    it("saves and loads config", () => {
      const config = storage.getConfig();
      config.thresholds.warning = 20;
      storage.saveConfig(config);
      const loaded = storage.getConfig();
      expect(loaded.thresholds.warning).toBe(20);
    });
  });

  describe("lifecycle tabs", () => {
    it("saves and retrieves a lifecycle tab", () => {
      const tab = makeLifecycleTab();
      storage.saveLifecycleTab(tab);
      const loaded = storage.getLifecycleTab("test-uuid-1");
      expect(loaded).not.toBeNull();
      expect(loaded!.url).toBe("https://example.com");
      expect(loaded!.state).toBe("snoozed");
    });

    it("lists all lifecycle tabs", () => {
      storage.saveLifecycleTab(makeLifecycleTab({ id: "a", state: "snoozed" }));
      storage.saveLifecycleTab(makeLifecycleTab({ id: "b", state: "queued" }));
      storage.saveLifecycleTab(makeLifecycleTab({ id: "c", state: "watching" }));
      const all = storage.listLifecycleTabs();
      expect(all).toHaveLength(3);
    });

    it("filters lifecycle tabs by state", () => {
      storage.saveLifecycleTab(makeLifecycleTab({ id: "a", state: "snoozed" }));
      storage.saveLifecycleTab(makeLifecycleTab({ id: "b", state: "queued" }));
      storage.saveLifecycleTab(makeLifecycleTab({ id: "c", state: "snoozed" }));
      const snoozed = storage.listLifecycleTabs("snoozed");
      expect(snoozed).toHaveLength(2);
      expect(snoozed.every((t) => t.state === "snoozed")).toBe(true);
    });

    it("removes a lifecycle tab", () => {
      storage.saveLifecycleTab(makeLifecycleTab({ id: "to-remove" }));
      expect(storage.getLifecycleTab("to-remove")).not.toBeNull();
      const removed = storage.removeLifecycleTab("to-remove");
      expect(removed).toBe(true);
      expect(storage.getLifecycleTab("to-remove")).toBeNull();
    });

    it("returns false when removing nonexistent tab", () => {
      expect(storage.removeLifecycleTab("nope")).toBe(false);
    });

    it("updates a lifecycle tab in place", () => {
      storage.saveLifecycleTab(makeLifecycleTab({ id: "upd", state: "snoozed", wakeAt: 1000 }));
      storage.saveLifecycleTab(makeLifecycleTab({ id: "upd", state: "snoozed", wakeAt: 2000 }));
      const loaded = storage.getLifecycleTab("upd");
      expect(loaded!.wakeAt).toBe(2000);
      expect(storage.listLifecycleTabs()).toHaveLength(1);
    });
  });

  describe("active tabs sync", () => {
    it("saves and retrieves synced active tabs", () => {
      const tabs = [makeActiveTab({ id: 1 }), makeActiveTab({ id: 2 })];
      storage.saveActiveTabs(tabs);
      const loaded = storage.getActiveTabs();
      expect(loaded).toHaveLength(2);
    });

    it("returns empty array when no sync has happened", () => {
      expect(storage.getActiveTabs()).toEqual([]);
    });
  });
});
