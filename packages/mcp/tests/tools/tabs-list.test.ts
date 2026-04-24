import { describe, it, expect, vi } from "vitest";
import { handleTabsList } from "../../src/tools/tabs-list.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-list tool", () => {
  it("returns formatted active tabs", async () => {
    const client = { listTabs: vi.fn().mockResolvedValue({ tabs: [
      { id: 1, windowId: 1, url: "https://example.com", title: "Example", pinned: false, lastAccessed: Date.now(), createdAt: Date.now() },
    ] }) } as unknown as BridgeClient;
    const result = await handleTabsList(client, {});
    expect(result.content[0].text).toContain("1 active tab(s)");
    expect(result.content[0].text).toContain("Example");
  });

  it("returns message when empty", async () => {
    const client = { listTabs: vi.fn().mockResolvedValue({ tabs: [] }) } as unknown as BridgeClient;
    const result = await handleTabsList(client, {});
    expect(result.content[0].text).toContain("No active tabs");
  });
});
