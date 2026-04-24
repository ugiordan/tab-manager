# Bridge Server

Local Node.js + Express server providing REST API and WebSocket for real-time communication between the extension and MCP plugin.

## Overview

The bridge server is **optional**. The extension works fully standalone. The bridge exists to:

1. Provide REST API access for the MCP plugin
2. Store lifecycle state in JSON files for persistence outside Chrome
3. Enable WebSocket commands (e.g., wake tabs from Claude Code)

## Module Structure

```
packages/bridge/
  src/
    server.ts        # Entry point, PID/port management, signal handling
    app.ts           # Express app factory, middleware
    storage.ts       # JSON file storage with path traversal protection
    websocket.ts     # WebSocket manager for real-time broadcasting
    types.ts         # Shared type definitions
    routes/
      health.ts      # GET /health
      tabs.ts        # GET/POST /tabs
      lifecycle.ts   # CRUD for lifecycle tabs
      meeting.ts     # Meeting mode start/end
      stats.ts       # Tab statistics
```

## Startup

```bash
npm run bridge:start
# or
node packages/bridge/dist/server.js
```

1. Checks for existing PID file, cleans up stale instances
2. Tries port 19876, increments up to 10 times if taken
3. Writes PID and port files to `~/.tab-manager/`
4. Starts Express + WebSocket server on `127.0.0.1`

## Middleware Stack

1. **CORS**: rejects requests with `Origin` header that isn't `chrome-extension://`
2. **Logging**: logs `METHOD /path` for every request
3. **Body parsing**: `express.json({ limit: "1mb" })`
4. **Routes**: health, tabs, lifecycle, meeting, stats
5. **Error handler**: catches unhandled errors, returns 500

## Storage

JSON files in `~/.tab-manager/`:

| File | Contents |
|------|----------|
| `config.json` | Extension configuration |
| `active-tabs.json` | Last synced active tabs from extension |
| `lifecycle-tabs.json` | Snoozed, queued, and watching tabs |

Storage operations are synchronous (single-user, single-process). All `JSON.parse` calls have try/catch with safe defaults on corruption.

Path traversal protection prevents `../../` in file names.

## Input Validation

| Endpoint | Validation |
|----------|-----------|
| `POST /lifecycle/snooze` | URL must be http/https, wakeAt must be positive number |
| `POST /lifecycle/queue` | URL must be http/https |
| `POST /lifecycle/watch` | URL must be http/https, cssSelector required and max 500 chars |
| `POST /tabs/sync` | Body must be array, each tab must have url (string), title (string), id (number) |
| `POST /meeting/end` | meetingId required |

## WebSocket

The WebSocket server runs on the same port at `/ws`. It supports:

- **Broadcast**: server pushes `state-change` events to all connected clients when lifecycle state changes
- **Commands**: clients can send `{ type: "command", payload: { command: "wake", lifecycleIds: [...] } }` to trigger tab wakes in the extension

## Tests

37 tests covering routes, storage, WebSocket, and integration:

```bash
npm test -w packages/bridge
```
