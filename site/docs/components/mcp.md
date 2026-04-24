# MCP Plugin

Model Context Protocol plugin providing 9 tools for Claude Code to manage browser tabs through the bridge server.

## Overview

The MCP plugin is a thin client over the bridge REST API. It translates Claude Code tool calls into bridge HTTP requests and formats the results as text for the AI.

## Setup

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "tab-manager": {
      "command": "node",
      "args": ["<path-to-repo>/packages/mcp/dist/index.js"],
      "env": {
        "BRIDGE_URL": "http://localhost:19876"
      }
    }
  }
}
```

!!! warning "Bridge required"
    The MCP plugin requires the bridge server to be running. Start it with `npm run bridge:start`.

!!! warning "Localhost only"
    `BRIDGE_URL` must point to `localhost` or `127.0.0.1`. The plugin exits on startup if configured with a remote host.

## Module Structure

```
packages/mcp/
  src/
    index.ts                 # MCP server registration, tool definitions
    client.ts                # Bridge HTTP client with timeout
    tools/
      tabs-list.ts           # List active tabs
      tabs-lifecycle.ts      # List lifecycle tabs by state
      tabs-snooze.ts         # Snooze a tab
      tabs-queue.ts          # Queue a tab
      tabs-watch.ts          # Watch a tab for changes
      tabs-wake.ts           # Wake lifecycle tabs
      tabs-meeting.ts        # Meeting mode start/end
      tabs-stats.ts          # Tab statistics
      tabs-suggest.ts        # AI-friendly suggestions
```

## Input Validation

All tool inputs are validated with Zod schemas:

- **URLs**: validated with `z.string().url()` (must be valid URL format)
- **Durations**: `z.number().positive()` (no zero or negative)
- **State filters**: `z.enum(["snoozed", "queued", "watching"])`
- **Lifecycle IDs**: encoded with `encodeURIComponent()` to prevent path traversal

## Error Handling

- All tool handlers use a `wrapTool` wrapper that catches errors and returns MCP `isError` responses
- `tabs_wake` has per-ID error isolation: if one wake fails, others still proceed, and partial results are returned
- Error messages are sanitized (no bridge response bodies leaked)
- Bridge HTTP client has a 5-second timeout via `AbortController`

## Tests

26 tests covering all tool handlers and the bridge client:

```bash
npm test -w packages/mcp
```

[:octicons-arrow-right-24: Full tool reference](../mcp-tools/reference.md)
