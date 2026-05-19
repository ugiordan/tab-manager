---
name: managing-tabs
description: >-
  Manages Chrome browser tabs through lifecycle states (snooze, queue, watch)
  via a local bridge server REST API. Use when the user asks to manage tabs,
  snooze tabs, queue tabs for later, watch pages for changes, start or end
  meeting mode, get tab statistics, suggest tab cleanup, or organize browser tabs.
---

# Managing tabs

Manages Chrome browser tabs through three lifecycle states: snoozed (reopen later), queued (ordered reading list) and watching (poll for page changes). All operations go through a local bridge server REST API.

## Prerequisites

Before any operation, verify the bridge is running:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/check-bridge.sh
```

If the bridge is not running, tell the user to start it:

```bash
cd <tab-manager-repo> && npm run bridge:start
```

The default bridge URL is `http://localhost:19876`. If the user has configured a different port, set the `BRIDGE_URL` environment variable.

## Operations

All operations use `curl` against the bridge REST API. The bridge accepts requests with no `Origin` header (curl, scripts).

### List active tabs

```bash
curl -s http://localhost:19876/tabs | jq .
```

Returns `{"tabs": [...]}` with each tab having `id`, `windowId`, `url`, `title`, `pinned`, `lastAccessed`.

### List lifecycle tabs

List all lifecycle tabs (snoozed, queued, watching). Returns `{"tabs": [...]}`.

```bash
curl -s http://localhost:19876/lifecycle | jq .
```

Filter by state:

```bash
curl -s http://localhost:19876/lifecycle/snoozed | jq .
curl -s http://localhost:19876/lifecycle/queued | jq .
curl -s http://localhost:19876/lifecycle/watching | jq .
```

### Snooze a tab

Close a tab now, reopen it later. Requires `url`. Optional: `title`, `wakeAt` (unix timestamp in ms), `originWindowId`.

```bash
curl -s -X POST http://localhost:19876/lifecycle/snooze \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "title": "Example", "wakeAt": 1712345678000}'
```

If the user specifies a duration instead of a timestamp, calculate `wakeAt` as: `current_time_ms + duration_minutes * 60000`. Use `date +%s%3N` to get current time in milliseconds.

### Queue a tab

Save a tab to an ordered reading list. Position is assigned automatically (end of queue).

```bash
curl -s -X POST http://localhost:19876/lifecycle/queue \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "title": "Example"}'
```

### Watch a tab

Monitor a page element for changes using a CSS selector. The extension polls periodically and notifies on change.

```bash
curl -s -X POST http://localhost:19876/lifecycle/watch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "title": "Example", "cssSelector": "#status", "pollIntervalMinutes": 15}'
```

`cssSelector` is required (max 500 characters). `pollIntervalMinutes` defaults from server config.

### Wake a lifecycle tab

Remove a tab from lifecycle storage and signal the extension to reopen it:

```bash
curl -s -X POST http://localhost:19876/lifecycle/{id}/wake
```

Replace `{id}` with the lifecycle tab's `id` from the list response.

### Wake multiple lifecycle tabs

Bulk wake tabs in one call. Use `state` to wake all tabs of a given type, or `ids` to wake specific tabs. Omit both to wake everything.

```bash
# Wake all snoozed tabs
curl -s -X POST http://localhost:19876/lifecycle/wake-batch \
  -H 'Content-Type: application/json' \
  -d '{"state": "snoozed"}'

# Wake specific tabs by ID
curl -s -X POST http://localhost:19876/lifecycle/wake-batch \
  -H 'Content-Type: application/json' \
  -d '{"ids": ["id-1", "id-2"]}'

# Wake all lifecycle tabs (snoozed + queued + watching)
curl -s -X POST http://localhost:19876/lifecycle/wake-batch \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Returns `{"wokenCount": N, "tabs": [...]}`. Returns 200 with `wokenCount: 0` if nothing matched.

### Remove a lifecycle tab

Permanently delete a lifecycle tab without reopening it:

```bash
curl -s -X DELETE http://localhost:19876/lifecycle/{id}
```

### Start meeting mode

Bulk-snooze all active non-pinned tabs. The extension closes them and creates placeholder tabs to keep windows alive.

```bash
curl -s -X POST http://localhost:19876/meeting/start
```

Returns `{"meetingId": "...", "snoozedCount": N, "pinnedKept": N, "excludedCount": N}`. Tabs matching configured exclude patterns (default: `meet.google.com`) are kept open. Save the `meetingId` for ending the meeting. Returns `409` if a meeting is already active.

### End meeting mode

Restore all tabs from a meeting. Requires the `meetingId` from the start response.

```bash
curl -s -X POST http://localhost:19876/meeting/end \
  -H 'Content-Type: application/json' \
  -d '{"meetingId": "the-meeting-id"}'
```

### Get statistics

```bash
curl -s http://localhost:19876/stats | jq .
```

Returns `activeTabs`, `snoozedTabs`, `queuedTabs`, `watchingTabs`, `tabsByWindow` (record of windowId to count), `staleTabs`, `topDomains` (array of {domain, count}), `nextSnoozeWake` (timestamp or null), `watchedChanges` (count of watched tabs with detected changes).

## Workflows

### Clean up stale tabs

1. Fetch active tabs: `curl -s http://localhost:19876/tabs`
2. Fetch lifecycle tabs: `curl -s http://localhost:19876/lifecycle`
3. Analyze the data:
   - Tabs idle for more than 2 hours (`lastAccessed` older than 2h) are stale candidates
   - Tabs from the same domain appearing 3+ times suggest consolidation
   - Pinned tabs should never be suggested for cleanup
4. Present suggestions to the user grouped by action (snooze, queue, close)
5. Execute the user's chosen actions

### Meeting mode

1. Start: `curl -s -X POST http://localhost:19876/meeting/start`
2. Save the returned `meetingId`
3. When the user says the meeting is over, end it: `curl -s -X POST http://localhost:19876/meeting/end -H 'Content-Type: application/json' -d '{"meetingId": "..."}'`

### Bulk snooze by pattern

1. List active tabs
2. Filter by URL pattern or title the user specifies
3. For each matching tab, snooze it with the requested duration
4. Report how many tabs were snoozed

## Error handling

- **Bridge unreachable**: Tell the user to start the bridge with `npm run bridge:start`
- **404 on wake/remove**: The lifecycle tab ID does not exist. List lifecycle tabs to find valid IDs.
- **400 on snooze/queue/watch**: Check that `url` is provided and starts with `http://` or `https://`
- **400 on meeting end**: `meetingId` is required. If the user lost it, list snoozed lifecycle tabs and look for ones with a `meetingId` field.
- **409 on meeting start**: A meeting is already active. End it first or check snoozed tabs for the active meetingId.

## References

- [Bridge REST API reference](references/api.md): Complete endpoint documentation with request/response schemas
