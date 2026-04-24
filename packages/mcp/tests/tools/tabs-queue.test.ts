import { describe, it, expect, vi } from "vitest";
import { handleTabsQueue } from "../../src/tools/tabs-queue.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-queue tool", () => {
  it("queues a tab", async () => {
    const client = {
      queue: vi.fn().mockResolvedValue({
        tab: { id: "x", url: "https://example.com", title: "Example", state: "queued", position: 0 }
      })
    } as unknown as BridgeClient;
    const result = await handleTabsQueue(client, {
      url: "https://example.com",
      title: "Example",
      origin_window_id: 1
    });
    expect(result.content[0].text).toContain("Queued");
    expect(result.content[0].text).toContain("position");
  });
});
