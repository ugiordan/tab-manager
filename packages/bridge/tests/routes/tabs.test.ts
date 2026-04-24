import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("tabs routes", () => {
  let app: ReturnType<typeof createApp>["app"];
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    const result = createApp({ storageDir: testDir });
    app = result.app;
  });

  it("GET /tabs returns empty array initially", async () => {
    const res = await request(app).get("/tabs");
    expect(res.status).toBe(200);
    expect(res.body.tabs).toEqual([]);
  });

  it("POST /tabs/sync saves and returns tab count", async () => {
    const tabs = [
      { id: 1, windowId: 1, url: "https://a.com", title: "A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
      { id: 2, windowId: 1, url: "https://b.com", title: "B", pinned: false, index: 1, lastAccessed: Date.now(), createdAt: Date.now() },
    ];
    const res = await request(app).post("/tabs/sync").send({ tabs });
    expect(res.status).toBe(200);
    expect(res.body.synced).toBe(2);
  });

  it("GET /tabs returns synced tabs", async () => {
    const tabs = [
      { id: 1, windowId: 1, url: "https://a.com", title: "A", pinned: false, index: 0, lastAccessed: Date.now(), createdAt: Date.now() },
    ];
    await request(app).post("/tabs/sync").send({ tabs });
    const res = await request(app).get("/tabs");
    expect(res.status).toBe(200);
    expect(res.body.tabs).toHaveLength(1);
    expect(res.body.tabs[0].url).toBe("https://a.com");
  });

  it("POST /tabs/sync rejects non-array", async () => {
    const res = await request(app).post("/tabs/sync").send({ tabs: "nope" });
    expect(res.status).toBe(400);
  });
});
