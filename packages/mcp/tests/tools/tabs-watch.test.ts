import { describe, it, expect, vi } from "vitest";
import { handleTabsWatch } from "../../src/tools/tabs-watch.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-watch tool", () => {
  it("watches a tab with CSS selector", async () => {
    const client = {
      watch: vi.fn().mockResolvedValue({
        tab: { id: "x", url: "https://example.com", title: "Example", state: "watching", cssSelector: ".status", pollIntervalMinutes: 30 }
      })
    } as unknown as BridgeClient;
    const result = await handleTabsWatch(client, {
      url: "https://example.com",
      title: "Example",
      origin_window_id: 1,
      css_selector: ".status"
    });
    expect(result.content[0].text).toContain("Watching");
    expect(result.content[0].text).toContain(".status");
  });

  it("watches a tab with custom poll interval", async () => {
    const client = {
      watch: vi.fn().mockResolvedValue({
        tab: { id: "x", url: "https://example.com", title: "Example", state: "watching", cssSelector: ".status", pollIntervalMinutes: 15 }
      })
    } as unknown as BridgeClient;
    const result = await handleTabsWatch(client, {
      url: "https://example.com",
      title: "Example",
      origin_window_id: 1,
      css_selector: ".status",
      poll_interval_minutes: 15
    });
    expect(result.content[0].text).toContain("15 minutes");
  });
});
