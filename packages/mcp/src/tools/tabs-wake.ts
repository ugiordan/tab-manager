import { BridgeClient } from "../client.js";

export async function handleTabsWake(client: BridgeClient, args: { lifecycle_ids: string[] }) {
  const woken: any[] = [];
  const errors: string[] = [];
  for (const id of args.lifecycle_ids) {
    try {
      const { tab } = await client.wake(id);
      woken.push(tab);
    } catch (err) {
      errors.push(`Failed to wake ${id}: ${(err as Error).message}`);
    }
  }
  const parts = [`Woken: ${woken.length} tab(s)`];
  if (errors.length > 0) parts.push(`Errors: ${errors.join(", ")}`);
  if (woken.length > 0) parts.push(woken.map((t) => `- ${t.title} (${t.url})`).join("\n"));
  return { content: [{ type: "text" as const, text: parts.join("\n\n") }] };
}
