import { BridgeClient } from "../client.js";

export async function handleTabsStats(client: BridgeClient) {
  const stats = await client.stats();
  const lines = [
    `Active tabs: ${stats.activeTabs}`,
    `Snoozed: ${stats.snoozedTabs}`,
    `Queued: ${stats.queuedTabs}`,
    `Watching: ${stats.watchingTabs} (${stats.watchedChanges} with changes)`,
    `Stale (2h+ idle): ${stats.staleTabs}`,
  ];
  if (stats.nextSnoozeWake) {
    const mins = Math.round((stats.nextSnoozeWake - Date.now()) / 60000);
    lines.push(`Next snooze wake: ${mins > 0 ? `in ${mins}m` : "overdue"}`);
  }
  if (stats.topDomains?.length > 0) {
    lines.push(`\nTop domains:`);
    for (const d of stats.topDomains.slice(0, 5)) {
      lines.push(`  ${d.domain}: ${d.count}`);
    }
  }
  return { content: [{ type: "text" as const, text: lines.join("\n") }] };
}
