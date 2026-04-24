import { BridgeClient } from "../client.js";

export async function handleTabsSnooze(client: BridgeClient, args: {
  url: string; title: string; origin_window_id: number;
  duration_minutes?: number; wake_at?: number;
}) {
  const wakeAt = args.wake_at ?? Date.now() + (args.duration_minutes ?? 60) * 60000;
  const { tab } = await client.snooze({
    url: args.url, title: args.title, originWindowId: args.origin_window_id, wakeAt,
  });
  const mins = Math.round((wakeAt - Date.now()) / 60000);
  return { content: [{ type: "text" as const, text: `Snoozed "${tab.title}" (${tab.url}). Wakes in ${mins} minutes.` }] };
}
