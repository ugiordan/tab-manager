import { BridgeClient } from "../client.js";

export async function handleTabsSuggest(client: BridgeClient) {
  const { tabs } = await client.listTabs();
  if (tabs.length === 0) {
    return { content: [{ type: "text" as const, text: "No active tabs to analyze." }] };
  }
  const { tabs: lifecycleTabs } = await client.listLifecycle();
  const now = Date.now();
  const suggestions: string[] = [];

  const byDomain: Record<string, any[]> = {};
  for (const tab of tabs) {
    try {
      const domain = new URL(tab.url).hostname;
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(tab);
    } catch { /* skip */ }
  }

  const staleTabs = tabs.filter((t: any) => !t.pinned && now - t.lastAccessed > 2 * 60 * 60 * 1000);
  if (staleTabs.length > 0) {
    const oldest = staleTabs.sort((a: any, b: any) => a.lastAccessed - b.lastAccessed).slice(0, 5);
    const staleLines = oldest.map((t: any) => {
      const hours = Math.round((now - t.lastAccessed) / 3600000);
      return `  "${t.title}" (${hours}h idle)`;
    });
    suggestions.push(`Stale tabs (suggestion: snooze or queue):\n${staleLines.join("\n")}`);
  }

  for (const [domain, domainTabs] of Object.entries(byDomain)) {
    if (domainTabs.length >= 3) {
      suggestions.push(`${domainTabs.length} tabs from ${domain} (suggestion: queue extras, keep 1-2 active)`);
    }
  }

  const summary = [
    `Active: ${tabs.length} tab(s)`,
    `Lifecycle: ${lifecycleTabs.length} tab(s) (${lifecycleTabs.filter((t: any) => t.state === "snoozed").length} snoozed, ${lifecycleTabs.filter((t: any) => t.state === "queued").length} queued, ${lifecycleTabs.filter((t: any) => t.state === "watching").length} watching)`,
  ];

  const text = suggestions.length > 0
    ? `${summary.join("\n")}\n\n${suggestions.length} suggestion(s):\n\n${suggestions.join("\n\n")}`
    : `${summary.join("\n")}\n\nNo suggestions. Tabs look manageable.`;

  return { content: [{ type: "text" as const, text }] };
}
