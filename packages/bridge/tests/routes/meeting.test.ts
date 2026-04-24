import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("meeting routes", () => {
  let app: ReturnType<typeof createApp>["app"];
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    const result = createApp({ storageDir: testDir });
    app = result.app;
    result.context.storage.saveActiveTabs([
      { id: 1, windowId: 1, url: "https://a.com", title: "A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
      { id: 2, windowId: 1, url: "https://b.com", title: "B", pinned: true, index: 1, lastAccessed: Date.now(), createdAt: Date.now() },
      { id: 3, windowId: 2, url: "https://c.com", title: "C", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
    ]);
  });

  it("POST /meeting/start snoozes all non-pinned tabs", async () => {
    const res = await request(app).post("/meeting/start");
    expect(res.status).toBe(200);
    expect(res.body.snoozedCount).toBe(2);
    expect(res.body.pinnedKept).toBe(1);
    expect(res.body.meetingId).toBeDefined();

    const lifecycle = await request(app).get("/lifecycle/snoozed");
    expect(lifecycle.body.tabs).toHaveLength(2);
    expect(lifecycle.body.tabs.every((t: any) => t.state === "snoozed")).toBe(true);
  });

  it("POST /meeting/end wakes all meeting-snoozed tabs", async () => {
    const start = await request(app).post("/meeting/start");
    const meetingId = start.body.meetingId;

    const res = await request(app).post("/meeting/end").send({ meetingId });
    expect(res.status).toBe(200);
    expect(res.body.wokenCount).toBe(2);

    const lifecycle = await request(app).get("/lifecycle/snoozed");
    expect(lifecycle.body.tabs).toHaveLength(0);
  });
});
