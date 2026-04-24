import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BridgeClient } from "./client.js";
import { handleTabsList } from "./tools/tabs-list.js";
import { handleTabsLifecycle } from "./tools/tabs-lifecycle.js";
import { handleTabsSnooze } from "./tools/tabs-snooze.js";
import { handleTabsQueue } from "./tools/tabs-queue.js";
import { handleTabsWatch } from "./tools/tabs-watch.js";
import { handleTabsWake } from "./tools/tabs-wake.js";
import { handleTabsMeeting } from "./tools/tabs-meeting.js";
import { handleTabsStats } from "./tools/tabs-stats.js";
import { handleTabsSuggest } from "./tools/tabs-suggest.js";

const BRIDGE_URL = process.env.BRIDGE_URL || "http://localhost:19876";
try {
  const parsed = new URL(BRIDGE_URL);
  if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    console.error("BRIDGE_URL must point to localhost or 127.0.0.1");
    process.exit(1);
  }
} catch {
  console.error("BRIDGE_URL is not a valid URL");
  process.exit(1);
}
const server = new McpServer({ name: "tab-lifecycle-manager", version: "0.1.0" });
const client = new BridgeClient(BRIDGE_URL);

function wrapTool<T>(handler: (client: BridgeClient, args: T) => Promise<any>) {
  return async (args: T) => {
    try {
      return await handler(client, args);
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: Bridge server is not reachable. Make sure it's running with 'npm run bridge:start'. Details: ${(err as Error).message}` }],
        isError: true,
      };
    }
  };
}

server.tool("tabs_list", "List all active Chrome tabs", {
  window_id: z.number().optional().describe("Filter by window ID"),
}, wrapTool(handleTabsList));

server.tool("tabs_lifecycle", "List lifecycle tabs (snoozed, queued, watching)", {
  state: z.enum(["snoozed", "queued", "watching"]).optional().describe("Filter by lifecycle state"),
}, wrapTool(handleTabsLifecycle));

server.tool("tabs_snooze", "Snooze tabs: close now, reopen later at a specified time", {
  url: z.string().url().describe("Tab URL to snooze"),
  title: z.string().describe("Tab title"),
  origin_window_id: z.number().describe("Window the tab came from"),
  duration_minutes: z.number().positive().optional().describe("Snooze duration in minutes (default: 60)"),
  wake_at: z.number().positive().optional().describe("Exact timestamp to wake (overrides duration_minutes)"),
}, wrapTool(handleTabsSnooze));

server.tool("tabs_queue", "Queue a tab for later reading", {
  url: z.string().url().describe("Tab URL to queue"),
  title: z.string().describe("Tab title"),
  origin_window_id: z.number().describe("Window the tab came from"),
}, wrapTool(handleTabsQueue));

server.tool("tabs_watch", "Watch a tab for page changes using a CSS selector", {
  url: z.string().url().describe("Tab URL to watch"),
  title: z.string().describe("Tab title"),
  origin_window_id: z.number().describe("Window the tab came from"),
  css_selector: z.string().describe("CSS selector for the element to watch"),
  poll_interval_minutes: z.number().optional().describe("Poll interval in minutes (default: 30)"),
}, wrapTool(handleTabsWatch));

server.tool("tabs_wake", "Wake snoozed tabs or open queued/watched tabs", {
  lifecycle_ids: z.array(z.string()).describe("Lifecycle tab IDs to wake/open"),
}, wrapTool(handleTabsWake));

server.tool("tabs_meeting", "Start or end meeting mode (bulk snooze/wake non-pinned tabs)", {
  action: z.enum(["start", "end"]).describe("Start or end meeting mode"),
  meeting_id: z.string().optional().describe("Meeting ID to end (from start response)"),
}, wrapTool(handleTabsMeeting));

server.tool("tabs_stats", "Get tab statistics with lifecycle breakdown", async () => {
  try { return await handleTabsStats(client); }
  catch (err) { return { content: [{ type: "text" as const, text: `Error: Bridge not reachable. Details: ${(err as Error).message}` }], isError: true }; }
});

server.tool("tabs_suggest", "Analyze tabs and suggest snooze/queue/watch actions", async () => {
  try { return await handleTabsSuggest(client); }
  catch (err) { return { content: [{ type: "text" as const, text: `Error: Bridge not reachable. Details: ${(err as Error).message}` }], isError: true }; }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tab Lifecycle Manager MCP server running on stdio");
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
