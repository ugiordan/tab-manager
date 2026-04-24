import { describe, it, expect, vi } from "vitest";
import { handleTabsStats } from "../../src/tools/tabs-stats.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-stats tool", () => {
  it("formats stats with all fields", async () => {
    const client = {
      stats: vi.fn().mockResolvedValue({
        activeTabs: 12,
        snoozedTabs: 3,
        queuedTabs: 2,
        watchingTabs: 1,
        watchedChanges: 1,
        staleTabs: 4,
        nextSnoozeWake: Date.now() + 300000,
        topDomains: [
          { domain: "github.com", count: 5 },
          { domain: "jira.com", count: 3 },
        ],
      }),
    } as unknown as BridgeClient;

    const result = await handleTabsStats(client);
    const text = result.content[0].text;
    expect(text).toContain("Active tabs: 12");
    expect(text).toContain("Snoozed: 3");
    expect(text).toContain("Queued: 2");
    expect(text).toContain("Watching: 1 (1 with changes)");
    expect(text).toContain("Stale (2h+ idle): 4");
    expect(text).toContain("Next snooze wake:");
    expect(text).toContain("github.com: 5");
  });

  it("handles empty stats", async () => {
    const client = {
      stats: vi.fn().mockResolvedValue({
        activeTabs: 0,
        snoozedTabs: 0,
        queuedTabs: 0,
        watchingTabs: 0,
        watchedChanges: 0,
        staleTabs: 0,
        nextSnoozeWake: null,
        topDomains: [],
      }),
    } as unknown as BridgeClient;

    const result = await handleTabsStats(client);
    const text = result.content[0].text;
    expect(text).toContain("Active tabs: 0");
    expect(text).not.toContain("Next snooze wake");
    expect(text).not.toContain("Top domains");
  });

  it("shows overdue snooze wake", async () => {
    const client = {
      stats: vi.fn().mockResolvedValue({
        activeTabs: 1,
        snoozedTabs: 1,
        queuedTabs: 0,
        watchingTabs: 0,
        watchedChanges: 0,
        staleTabs: 0,
        nextSnoozeWake: Date.now() - 60000,
        topDomains: [],
      }),
    } as unknown as BridgeClient;

    const result = await handleTabsStats(client);
    expect(result.content[0].text).toContain("overdue");
  });
});
