import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("lifecycle routes", () => {
  let app: ReturnType<typeof createApp>["app"];
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "tab-manager-test-"));
    const result = createApp({ storageDir: testDir });
    app = result.app;
  });

  it("POST /lifecycle/snooze creates snoozed tab", async () => {
    const wakeAt = Date.now() + 3600000;
    const res = await request(app).post("/lifecycle/snooze").send({
      url: "https://example.com",
      title: "Example",
      wakeAt,
      originWindowId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.tab.state).toBe("snoozed");
    expect(res.body.tab.url).toBe("https://example.com");
    expect(res.body.tab.wakeAt).toBe(wakeAt);
    expect(res.body.tab.id).toBeDefined();
  });

  it("POST /lifecycle/snooze rejects missing url", async () => {
    const res = await request(app).post("/lifecycle/snooze").send({
      title: "Example",
      wakeAt: Date.now() + 3600000,
      originWindowId: 1,
    });
    expect(res.status).toBe(400);
  });

  it("POST /lifecycle/queue creates queued tab with position 0", async () => {
    const res = await request(app).post("/lifecycle/queue").send({
      url: "https://example.com",
      title: "Example",
      originWindowId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.tab.state).toBe("queued");
    expect(res.body.tab.position).toBe(0);
  });

  it("POST /lifecycle/queue assigns sequential positions", async () => {
    await request(app).post("/lifecycle/queue").send({
      url: "https://a.com",
      title: "A",
      originWindowId: 1,
    });
    const res = await request(app).post("/lifecycle/queue").send({
      url: "https://b.com",
      title: "B",
      originWindowId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.tab.position).toBe(1);
  });

  it("POST /lifecycle/watch creates watched tab with cssSelector", async () => {
    const res = await request(app).post("/lifecycle/watch").send({
      url: "https://example.com",
      title: "Example",
      cssSelector: ".price",
      originWindowId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.tab.state).toBe("watching");
    expect(res.body.tab.cssSelector).toBe(".price");
    expect(res.body.tab.pollIntervalMinutes).toBe(30); // default from config
  });

  it("POST /lifecycle/watch rejects missing cssSelector", async () => {
    const res = await request(app).post("/lifecycle/watch").send({
      url: "https://example.com",
      title: "Example",
      originWindowId: 1,
    });
    expect(res.status).toBe(400);
  });

  it("GET /lifecycle returns all lifecycle tabs", async () => {
    await request(app).post("/lifecycle/snooze").send({
      url: "https://a.com",
      title: "A",
      wakeAt: Date.now() + 3600000,
      originWindowId: 1,
    });
    await request(app).post("/lifecycle/queue").send({
      url: "https://b.com",
      title: "B",
      originWindowId: 1,
    });
    const res = await request(app).get("/lifecycle");
    expect(res.status).toBe(200);
    expect(res.body.tabs).toHaveLength(2);
  });

  it("GET /lifecycle/:state filters by state", async () => {
    await request(app).post("/lifecycle/snooze").send({
      url: "https://a.com",
      title: "A",
      wakeAt: Date.now() + 3600000,
      originWindowId: 1,
    });
    await request(app).post("/lifecycle/queue").send({
      url: "https://b.com",
      title: "B",
      originWindowId: 1,
    });
    const res = await request(app).get("/lifecycle/snoozed");
    expect(res.status).toBe(200);
    expect(res.body.tabs).toHaveLength(1);
    expect(res.body.tabs[0].state).toBe("snoozed");
  });

  it("GET /lifecycle/:state rejects invalid state", async () => {
    const res = await request(app).get("/lifecycle/invalid");
    expect(res.status).toBe(400);
  });

  it("POST /lifecycle/:id/wake removes and returns tab", async () => {
    const createRes = await request(app).post("/lifecycle/snooze").send({
      url: "https://example.com",
      title: "Example",
      wakeAt: Date.now() + 3600000,
      originWindowId: 1,
    });
    const id = createRes.body.tab.id;
    const wakeRes = await request(app).post(`/lifecycle/${id}/wake`);
    expect(wakeRes.status).toBe(200);
    expect(wakeRes.body.tab.id).toBe(id);
    const listRes = await request(app).get("/lifecycle");
    expect(listRes.body.tabs).toHaveLength(0);
  });

  it("POST /lifecycle/:id/wake returns 404 for nonexistent", async () => {
    const res = await request(app).post("/lifecycle/nonexistent/wake");
    expect(res.status).toBe(404);
  });

  it("DELETE /lifecycle/:id removes tab", async () => {
    const createRes = await request(app).post("/lifecycle/queue").send({
      url: "https://example.com",
      title: "Example",
      originWindowId: 1,
    });
    const id = createRes.body.tab.id;
    const deleteRes = await request(app).delete(`/lifecycle/${id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.removed).toBe(true);
    const listRes = await request(app).get("/lifecycle");
    expect(listRes.body.tabs).toHaveLength(0);
  });

  it("DELETE /lifecycle/:id returns 404 for nonexistent", async () => {
    const res = await request(app).delete("/lifecycle/nonexistent");
    expect(res.status).toBe(404);
  });
});
