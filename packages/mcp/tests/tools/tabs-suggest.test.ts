import { describe, it, expect, vi } from "vitest";
import { handleTabsSuggest } from "../../src/tools/tabs-suggest.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-suggest tool", () => {
  it("returns suggestions based on tab analysis", async () => {
    const client = {
      listTabs: vi.fn().mockResolvedValue({ tabs: [
        { id: 1, url: "https://jira.com/browse/PROJ-123", title: "PROJ-123", pinned: false, lastAccessed: Date.now() - 86400000 * 3 },
      ] }),
      listLifecycle: vi.fn().mockResolvedValue({ tabs: [] }),
    } as unknown as BridgeClient;
    const result = await handleTabsSuggest(client);
    expect(result.content[0].text).toContain("suggestion");
  });

  it("handles empty tabs", async () => {
    const client = {
      listTabs: vi.fn().mockResolvedValue({ tabs: [] }),
      listLifecycle: vi.fn().mockResolvedValue({ tabs: [] }),
    } as unknown as BridgeClient;
    const result = await handleTabsSuggest(client);
    expect(result.content[0].text).toContain("No active tabs");
  });
});
