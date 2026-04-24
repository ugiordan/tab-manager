import { BridgeClient } from "../client.js";

export async function handleTabsQueue(client: BridgeClient, args: {
  url: string; title: string; origin_window_id: number;
}) {
  const { tab } = await client.queue({
    url: args.url, title: args.title, originWindowId: args.origin_window_id,
  });
  return { content: [{ type: "text" as const, text: `Queued "${tab.title}" at position ${tab.position}.` }] };
}
