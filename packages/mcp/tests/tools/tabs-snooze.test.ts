import { describe, it, expect, vi } from "vitest";
import { handleTabsSnooze } from "../../src/tools/tabs-snooze.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-snooze tool", () => {
  it("snoozes a tab with default duration", async () => {
    const client = {
      snooze: vi.fn().mockResolvedValue({
        tab: { id: "x", url: "https://example.com", title: "Example", state: "snoozed" }
      })
    } as unknown as BridgeClient;
    const result = await handleTabsSnooze(client, {
      url: "https://example.com",
      title: "Example",
      origin_window_id: 1
    });
    expect(result.content[0].text).toContain("Snoozed");
    expect(result.content[0].text).toContain("Example");
  });

  it("snoozes a tab with custom duration", async () => {
    const client = {
      snooze: vi.fn().mockResolvedValue({
        tab: { id: "x", url: "https://example.com", title: "Example", state: "snoozed" }
      })
    } as unknown as BridgeClient;
    const result = await handleTabsSnooze(client, {
      url: "https://example.com",
      title: "Example",
      origin_window_id: 1,
      duration_minutes: 30
    });
    expect(result.content[0].text).toContain("minutes");
  });
});
