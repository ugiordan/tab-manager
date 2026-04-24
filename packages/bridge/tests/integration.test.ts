import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("integration: lifecycle flow", () => {
  let app: ReturnType<typeof createApp>["app"];
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    const result = createApp({ storageDir: testDir });
    app = result.app;
  });

  it("full lifecycle: sync tabs, snooze one, check stats, wake it", async () => {
    await request(app).post("/tabs/sync").send({
      tabs: [
        { id: 1, windowId: 1, url: "https://a.com", title: "Tab A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
        { id: 2, windowId: 1, url: "https://b.com", title: "Tab B", pinned: false, index: 1, lastAccessed: Date.now(), createdAt: Date.now() },
      ],
    });

    const snooze = await request(app).post("/lifecycle/snooze").send({
      url: "https://b.com", title: "Tab B", originWindowId: 1, wakeAt: Date.now() + 7200000,
    });
    const snoozedId = snooze.body.tab.id;

    await request(app).post("/lifecycle/queue").send({
      url: "https://read.com", title: "Read Later", originWindowId: 1,
    });

    const stats = await request(app).get("/stats");
    expect(stats.body.activeTabs).toBe(2);
    expect(stats.body.snoozedTabs).toBe(1);
    expect(stats.body.queuedTabs).toBe(1);

    const wake = await request(app).post(`/lifecycle/${snoozedId}/wake`);
    expect(wake.body.tab.url).toBe("https://b.com");

    const stats2 = await request(app).get("/stats");
    expect(stats2.body.snoozedTabs).toBe(0);
    expect(stats2.body.queuedTabs).toBe(1);
  });

  it("meeting mode: start and end", async () => {
    await request(app).post("/tabs/sync").send({
      tabs: [
        { id: 1, windowId: 1, url: "https://a.com", title: "A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
        { id: 2, windowId: 1, url: "https://mail.com", title: "Mail", pinned: true, index: 1, lastAccessed: Date.now(), createdAt: Date.now() },
      ],
    });

    const start = await request(app).post("/meeting/start");
    expect(start.body.snoozedCount).toBe(1);
    expect(start.body.pinnedKept).toBe(1);

    const end = await request(app).post("/meeting/end").send({ meetingId: start.body.meetingId });
    expect(end.body.wokenCount).toBe(1);
  });
});
