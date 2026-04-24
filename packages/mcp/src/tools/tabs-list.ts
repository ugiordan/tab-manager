import { BridgeClient } from "../client.js";

export async function handleTabsList(client: BridgeClient, args: { window_id?: number }) {
  const { tabs } = await client.listTabs();
  let filtered = tabs;
  if (args.window_id) filtered = tabs.filter((t: any) => t.windowId === args.window_id);
  if (filtered.length === 0) {
    return { content: [{ type: "text" as const, text: "No active tabs found." }] };
  }
  const lines = filtered.map((t: any) => {
    const age = Math.round((Date.now() - t.lastAccessed) / 60000);
    return `[${t.id}] ${t.title} - ${t.url} (window ${t.windowId}, ${age}m ago${t.pinned ? ", pinned" : ""})`;
  });
  const windowCount = new Set(filtered.map((t: any) => t.windowId)).size;
  return { content: [{ type: "text" as const, text: `${filtered.length} active tab(s) across ${windowCount} window(s):\n\n${lines.join("\n")}` }] };
}
