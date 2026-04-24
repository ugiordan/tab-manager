import { describe, it, expect, vi, beforeEach } from "vitest";
import { BridgeClient } from "../src/client.js";

describe("BridgeClient", () => {
  let client: BridgeClient;

  beforeEach(() => {
    client = new BridgeClient("http://localhost:19876");
    vi.restoreAllMocks();
  });

  it("listTabs calls GET /tabs", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tabs: [] }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.listTabs();
    expect(result.tabs).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/tabs"), expect.anything());
  });

  it("listLifecycle calls GET /lifecycle with optional state", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tabs: [] }) });
    vi.stubGlobal("fetch", mockFetch);
    await client.listLifecycle("snoozed");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/lifecycle/snoozed"), expect.anything());
  });

  it("snooze calls POST /lifecycle/snooze", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tab: { id: "x", state: "snoozed" } }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.snooze({ url: "https://a.com", title: "A", originWindowId: 1, wakeAt: 1000 });
    expect(result.tab.state).toBe("snoozed");
  });

  it("queue calls POST /lifecycle/queue", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tab: { id: "x", state: "queued" } }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.queue({ url: "https://a.com", title: "A", originWindowId: 1 });
    expect(result.tab.state).toBe("queued");
  });

  it("watch calls POST /lifecycle/watch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tab: { id: "x", state: "watching" } }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.watch({ url: "https://a.com", title: "A", originWindowId: 1, cssSelector: ".x" });
    expect(result.tab.state).toBe("watching");
  });

  it("wake calls POST /lifecycle/:id/wake", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tab: { id: "x", url: "https://a.com" } }) });
    vi.stubGlobal("fetch", mockFetch);
    await client.wake("x");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/lifecycle/x/wake"), expect.objectContaining({ method: "POST" }));
  });

  it("meetingStart calls POST /meeting/start", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meetingId: "m1", snoozedCount: 5, pinnedKept: 2 }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.meetingStart();
    expect(result.snoozedCount).toBe(5);
  });

  it("meetingEnd calls POST /meeting/end", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ wokenCount: 5, tabs: [] }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.meetingEnd("m1");
    expect(result.wokenCount).toBe(5);
  });

  it("stats calls GET /stats", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ activeTabs: 10 }) });
    vi.stubGlobal("fetch", mockFetch);
    const result = await client.stats();
    expect(result.activeTabs).toBe(10);
  });

  it("throws on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "Internal Server Error" });
    vi.stubGlobal("fetch", mockFetch);
    await expect(client.listTabs()).rejects.toThrow("Bridge returned 500");
  });
});
