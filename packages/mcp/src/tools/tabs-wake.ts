import { BridgeClient } from "../client.js";

export async function handleTabsWake(client: BridgeClient, args: { lifecycle_ids: string[] }) {
  const woken = [];
  for (const id of args.lifecycle_ids) {
    const { tab } = await client.wake(id);
    woken.push(tab);
  }
  const lines = woken.map((t: any) => `  ${t.title} (${t.url})`);
  return { content: [{ type: "text" as const, text: `Woke ${woken.length} tab(s):\n${lines.join("\n")}` }] };
}
