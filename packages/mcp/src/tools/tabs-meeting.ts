import { BridgeClient } from "../client.js";

export async function handleTabsMeeting(client: BridgeClient, args: { action: "start" | "end"; meeting_id?: string }) {
  if (args.action === "start") {
    const result = await client.meetingStart();
    return { content: [{ type: "text" as const, text: `Meeting mode started. Snoozed ${result.snoozedCount} tab(s), kept ${result.pinnedKept} pinned. Meeting ID: ${result.meetingId}` }] };
  }
  if (args.action === "end" && !args.meeting_id) {
    return { content: [{ type: "text" as const, text: "Error: meeting_id is required to end a meeting. Use the ID returned by the start action." }], isError: true };
  }
  const result = await client.meetingEnd(args.meeting_id);
  return { content: [{ type: "text" as const, text: `Meeting mode ended. Woke ${result.wokenCount} tab(s).` }] };
}
