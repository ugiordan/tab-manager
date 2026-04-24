import { describe, it, expect, vi } from "vitest";
import { handleTabsWake } from "../../src/tools/tabs-wake.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-wake tool", () => {
  it("wakes multiple tabs", async () => {
    const client = {
      wake: vi.fn()
        .mockResolvedValueOnce({ tab: { id: "a", url: "https://a.com", title: "Tab A" } })
        .mockResolvedValueOnce({ tab: { id: "b", url: "https://b.com", title: "Tab B" } })
    } as unknown as BridgeClient;
    const result = await handleTabsWake(client, { lifecycle_ids: ["a", "b"] });
    expect(result.content[0].text).toContain("Woke 2 tab(s)");
    expect(result.content[0].text).toContain("Tab A");
    expect(result.content[0].text).toContain("Tab B");
  });

  it("wakes a single tab", async () => {
    const client = {
      wake: vi.fn().mockResolvedValue({ tab: { id: "a", url: "https://a.com", title: "Tab A" } })
    } as unknown as BridgeClient;
    const result = await handleTabsWake(client, { lifecycle_ids: ["a"] });
    expect(result.content[0].text).toContain("Woke 1 tab(s)");
  });
});
