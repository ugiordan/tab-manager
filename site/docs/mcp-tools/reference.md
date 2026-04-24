# MCP Tool Reference

## tabs_list

List all open browser tabs with window grouping.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `window_id` | number | No | Filter to a specific Chrome window ID |

**Example output:**
```
Active tabs: 12 across 2 window(s)

Window 1 (7 tabs):
- GitHub - ugiordan/tab-manager (https://github.com/...)
- Stack Overflow - Chrome MV3... (https://stackoverflow.com/...)
...
```

---

## tabs_lifecycle

List tabs in lifecycle states (snoozed, queued, watching).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `"snoozed"` \| `"queued"` \| `"watching"` | No | Filter by state. Omit for all. |

---

## tabs_snooze

Snooze a tab: close it now, reopen it later.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The tab URL to snooze |
| `title` | string | Yes | Tab title |
| `duration_minutes` | number (positive) | No | Minutes until wake. Default: 60 |
| `wake_at` | number (positive) | No | Unix timestamp (ms) for wake. Overrides duration. |

One of `duration_minutes` or `wake_at` should be provided.

---

## tabs_queue

Queue a tab for later reading.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The tab URL to queue |
| `title` | string | Yes | Tab title |

Tabs enter the queue at the end. Pull them with `tabs_wake` or the popup's "Next" button.

---

## tabs_watch

Watch a tab for content changes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The page URL to watch |
| `title` | string | Yes | Tab title |
| `css_selector` | string | Yes | CSS selector for the element to monitor |
| `poll_interval_minutes` | number | No | How often to check. Default: 30 |

The extension polls the page, extracts the selected element's text content, and hashes it. You get notified when the hash changes.

---

## tabs_wake

Wake one or more lifecycle tabs (reopen in browser).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lifecycle_ids` | string[] | Yes | Array of lifecycle tab IDs to wake |

!!! info "Partial results"
    If some IDs fail to wake (invalid, already woken), the tool returns partial results showing which succeeded and which failed.

---

## tabs_meeting

Start or end meeting mode.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | `"start"` \| `"end"` | Yes | Start or end meeting mode |
| `meeting_id` | string | For `end` | The meeting ID returned by `start` |

**Start**: snoozes all unpinned active tabs, returns a `meeting_id`.
**End**: restores all tabs from that meeting.

---

## tabs_stats

Get tab count and hygiene statistics. No parameters.

**Example output:**
```
Active: 12 tab(s) across 2 window(s)
Snoozed: 3 | Queued: 5 | Watching: 2
Next snooze wake: in 45 minutes
Top domains: github.com (4), stackoverflow.com (3)
```

---

## tabs_suggest

Get AI-friendly suggestions for tab management. No parameters.

Analyzes current tab state and returns actionable suggestions like:

- "You have 5 stale tabs (inactive >2h). Consider snoozing or closing them."
- "3 tabs are queued. Ready to work through them?"
- "2 watched pages have changed. Check them."
