# Bridge REST API

Base URL: `http://localhost:19876`

All endpoints accept and return JSON. The server rejects requests with non-`chrome-extension://` `Origin` headers.

## Health

### `GET /health`

Returns server status.

```json
{ "status": "ok" }
```

---

## Tabs

### `GET /tabs`

Returns the last synced active tabs from the extension.

**Response:**
```json
{
  "tabs": [
    {
      "id": 123,
      "windowId": 1,
      "url": "https://github.com",
      "title": "GitHub",
      "pinned": false,
      "index": 0,
      "lastAccessed": 1712345678000,
      "createdAt": 1712345600000
    }
  ]
}
```

### `POST /tabs/sync`

Syncs active tabs from the extension. Called automatically every minute.

**Request body:**
```json
{
  "tabs": [{ "id": 123, "url": "https://...", "title": "..." }]
}
```

Each tab must have `id` (number), `url` (string), and `title` (string).

---

## Lifecycle

### `GET /lifecycle`

Returns all lifecycle tabs.

**Response:**
```json
{ "tabs": [LifecycleTab, ...] }
```

### `GET /lifecycle/:state`

Returns lifecycle tabs filtered by state.

**Parameters:**

- `state`: `snoozed` | `queued` | `watching`

### `POST /lifecycle/snooze`

Create a snoozed tab.

**Request body:**
```json
{
  "url": "https://example.com",
  "title": "Example",
  "favIconUrl": "https://example.com/favicon.ico",
  "wakeAt": 1712345678000,
  "originWindowId": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `url` | string | Yes | Must be http or https |
| `title` | string | No | Defaults to "" |
| `wakeAt` | number | No | Must be positive if provided |
| `originWindowId` | number | No | Defaults to 0 |

**Response:** `201` with `{ "tab": LifecycleTab }`

### `POST /lifecycle/queue`

Create a queued tab. Position is assigned automatically (end of queue).

**Request body:**
```json
{
  "url": "https://example.com",
  "title": "Example"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `url` | string | Yes | Must be http or https |
| `title` | string | No | Defaults to "" |

**Response:** `201` with `{ "tab": LifecycleTab }`

### `POST /lifecycle/watch`

Create a watching tab.

**Request body:**
```json
{
  "url": "https://example.com",
  "title": "Example",
  "cssSelector": "#price",
  "pollIntervalMinutes": 15
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `url` | string | Yes | Must be http or https |
| `cssSelector` | string | Yes | Max 500 characters |
| `pollIntervalMinutes` | number | No | Defaults from config |

**Response:** `201` with `{ "tab": LifecycleTab }`

### `POST /lifecycle/:id/wake`

Wake a lifecycle tab (removes from storage, returns data for reopening).

**Response:** `200` with `{ "tab": LifecycleTab }`

**Error:** `404` if tab not found

### `DELETE /lifecycle/:id`

Permanently remove a lifecycle tab.

**Response:** `200` with `{ "removed": true }`

**Error:** `404` if tab not found

---

## Meeting

### `POST /meeting/start`

Snooze all active tabs for a meeting.

**Request body:**
```json
{ "tabs": [{ "url": "...", "title": "...", "windowId": 1 }] }
```

**Response:**
```json
{ "meetingId": "meeting-1712345678000", "closedCount": 12 }
```

### `POST /meeting/end`

Restore all tabs from a meeting.

**Request body:**
```json
{ "meetingId": "meeting-1712345678000" }
```

`meetingId` is required (returns 400 if missing).

**Response:**
```json
{ "restoredCount": 12, "tabs": [LifecycleTab, ...] }
```

---

## Stats

### `GET /stats`

Returns tab count and hygiene statistics.

**Response:**
```json
{
  "activeTabs": 12,
  "windows": 2,
  "snoozed": 3,
  "queued": 5,
  "watching": 2,
  "staleTabs": 4,
  "nextWake": 1712345678000
}
```
