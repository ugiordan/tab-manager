import { BridgeClient } from "../client.js";

export async function handleTabsLifecycle(client: BridgeClient, args: { state?: string }) {
  const { tabs } = await client.listLifecycle(args.state);
  if (tabs.length === 0) {
    const stateMsg = args.state ? ` in "${args.state}" state` : "";
    return { content: [{ type: "text" as const, text: `No lifecycle tabs found${stateMsg}.` }] };
  }
  const lines = tabs.map((t: any) => {
    let detail = `[${t.id}] ${t.title} (${t.state})`;
    if (t.state === "snoozed" && t.wakeAt) {
      const mins = Math.round((t.wakeAt - Date.now()) / 60000);
      detail += mins > 0 ? ` wakes in ${mins}m` : ` wake overdue`;
    }
    if (t.state === "queued") detail += ` position ${t.position}`;
    if (t.state === "watching") {
      detail += ` selector: ${t.cssSelector}`;
      if (t.changedAt) detail += ` CHANGED`;
    }
    return detail;
  });
  return { content: [{ type: "text" as const, text: `${tabs.length} lifecycle tab(s):\n\n${lines.join("\n")}` }] };
}
