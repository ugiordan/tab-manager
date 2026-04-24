import { describe, it, expect, vi } from "vitest";
import { handleTabsLifecycle } from "../../src/tools/tabs-lifecycle.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-lifecycle tool", () => {
  it("returns formatted lifecycle tabs", async () => {
    const client = { listLifecycle: vi.fn().mockResolvedValue({ tabs: [
      { id: "a", url: "https://a.com", title: "Tab A", state: "snoozed", wakeAt: Date.now() + 3600000, createdAt: Date.now() },
      { id: "b", url: "https://b.com", title: "Tab B", state: "queued", position: 0, createdAt: Date.now() },
    ] }) } as unknown as BridgeClient;
    const result = await handleTabsLifecycle(client, {});
    expect(result.content[0].text).toContain("Tab A");
    expect(result.content[0].text).toContain("snoozed");
  });

  it("returns message when empty", async () => {
    const client = { listLifecycle: vi.fn().mockResolvedValue({ tabs: [] }) } as unknown as BridgeClient;
    const result = await handleTabsLifecycle(client, {});
    expect(result.content[0].text).toContain("No lifecycle tabs");
  });
});
