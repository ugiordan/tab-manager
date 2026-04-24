import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("stats route", () => {
  let app: ReturnType<typeof createApp>["app"];
  let context: ReturnType<typeof createApp>["context"];
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    const result = createApp({ storageDir: testDir });
    app = result.app;
    context = result.context;
  });

  it("returns lifecycle-aware stats", async () => {
    context.storage.saveActiveTabs([
      { id: 1, windowId: 1, url: "https://a.com", title: "A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
      { id: 2, windowId: 2, url: "https://b.com", title: "B", pinned: false, index: 0, lastAccessed: Date.now() - 999999999, createdAt: Date.now() },
    ]);
    context.storage.saveLifecycleTab({ id: "s1", url: "https://c.com", title: "C", state: "snoozed", createdAt: Date.now(), originWindowId: 1, wakeAt: Date.now() + 1000 });
    context.storage.saveLifecycleTab({ id: "q1", url: "https://d.com", title: "D", state: "queued", createdAt: Date.now(), originWindowId: 1, position: 0 });
    context.storage.saveLifecycleTab({ id: "w1", url: "https://e.com", title: "E", state: "watching", createdAt: Date.now(), originWindowId: 1, cssSelector: ".x", changedAt: Date.now() });

    const res = await request(app).get("/stats");
    expect(res.status).toBe(200);
    expect(res.body.activeTabs).toBe(2);
    expect(res.body.snoozedTabs).toBe(1);
    expect(res.body.queuedTabs).toBe(1);
    expect(res.body.watchingTabs).toBe(1);
    expect(res.body.staleTabs).toBe(1);
    expect(res.body.watchedChanges).toBe(1);
    expect(res.body.nextSnoozeWake).toBeDefined();
    expect(res.body.topDomains).toBeDefined();
  });

  it("returns zeros when empty", async () => {
    const res = await request(app).get("/stats");
    expect(res.status).toBe(200);
    expect(res.body.activeTabs).toBe(0);
    expect(res.body.snoozedTabs).toBe(0);
    expect(res.body.queuedTabs).toBe(0);
    expect(res.body.watchingTabs).toBe(0);
  });
});
