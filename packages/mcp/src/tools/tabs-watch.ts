import { BridgeClient } from "../client.js";

export async function handleTabsWatch(client: BridgeClient, args: {
  url: string; title: string; origin_window_id: number;
  css_selector: string; poll_interval_minutes?: number;
}) {
  const { tab } = await client.watch({
    url: args.url, title: args.title, originWindowId: args.origin_window_id,
    cssSelector: args.css_selector, pollIntervalMinutes: args.poll_interval_minutes,
  });
  return { content: [{ type: "text" as const, text: `Watching "${tab.title}" for changes on selector "${tab.cssSelector}". Polling every ${tab.pollIntervalMinutes} minutes.` }] };
}
