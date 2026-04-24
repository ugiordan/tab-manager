import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

describe("GET /health", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(os.tmpdir(), "tab-mgr-test-")); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it("returns 200 with status ok", async () => {
    const { app } = createApp({ storageDir: dir });
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
