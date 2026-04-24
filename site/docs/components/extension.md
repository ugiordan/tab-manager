# Chrome Extension

Manifest V3 Chrome extension with a React + PatternFly 5 popup, options page, context menus, and content scripts.

## Module Structure

```
packages/extension/
  src/
    background/
      service-worker.ts      # Main entry, message routing, lifecycle events
      lifecycle-manager.ts   # State engine with mutex (snooze/queue/watch/wake)
      alarm-handler.ts       # Chrome Alarms handler (snooze wake, sync, poll)
      badge-manager.ts       # Badge count + color thresholds
      bridge-client.ts       # WebSocket + HTTP sync to bridge
      context-menu.ts        # Right-click menu setup and handlers
      meeting-mode.ts        # Snooze all / restore all
      notification-manager.ts # Chrome notifications for wakes and changes
      tab-tracker.ts         # In-memory active tab tracking
      watch-poller.ts        # Content-script-based element polling
    content/
      element-selector.ts    # Click-to-select overlay for watch targets
      extract-element.ts     # Injected to extract watched element content
    popup/
      App.tsx                # Main popup with tabbed views
      components/
        Header.tsx           # Tab count summary
        ActiveTabList.tsx    # Active tabs grouped by window
        SnoozedList.tsx      # Snoozed tabs with wake controls
        QueueList.tsx        # Ordered queue with drag reorder
        WatchingList.tsx     # Watched tabs with change status
        TabActions.tsx       # Snooze/Queue/Watch action buttons
        SnoozeDialog.tsx     # Time picker for snooze
        ErrorBoundary.tsx    # React error boundary
    options/
      App.tsx                # Settings form
    types.ts                 # Shared types and utilities
```

## Service Worker Lifecycle

The service worker registers on `chrome.runtime.onInstalled` and `chrome.runtime.onStartup`:

1. Sets up recurring alarms (`tabSync` every 1 min, `watchPoll` every 5 min)
2. Creates context menus
3. Updates badge count
4. Connects WebSocket to bridge (if available)
5. Checks for overdue snoozes (in case alarms were missed)

### Message Handlers

The service worker handles 11 message types from the popup and content scripts:

| Message | Source | Action |
|---------|--------|--------|
| `GET_TABS` | Popup | Returns tracked active tabs |
| `GET_CONFIG` | Popup | Returns extension config |
| `GET_LIFECYCLE` | Popup | Returns lifecycle tabs by state |
| `MEETING_MODE` | Popup | Activates meeting mode |
| `END_MEETING` | Popup | Deactivates meeting mode |
| `QUEUE_NEXT` | Popup | Pulls and opens next queued tab |
| `WAKE_TAB` | Popup | Wakes a specific lifecycle tab |
| `REMOVE_TAB` | Popup | Removes a lifecycle tab permanently |
| `REORDER_QUEUE` | Popup | Updates queue positions |
| `CLEAR_ATTENTION` | Popup | Clears attention indicators |
| `WATCH_ELEMENT_SELECTED` | Content script | Creates a watching lifecycle tab |
| `SNOOZE_FROM_POPUP` | Popup | Snoozes an active tab |
| `QUEUE_FROM_POPUP` | Popup | Queues an active tab |

All handlers have `.catch()` error handling and return fallback responses on failure.

## Watch Mechanism

### Element Selection

1. User right-clicks > "Watch tab for changes..."
2. Extension injects `element-selector.ts` content script
3. User hovers (highlight overlay) and clicks the target element
4. Content script generates a CSS selector using `CSS.escape()` for safety
5. Sends `WATCH_ELEMENT_SELECTED` to service worker (which uses `sender.tab.url`, not the message URL, to prevent spoofing)

### Polling

Every 5 minutes (via Chrome Alarm), up to 3 tabs are checked per cycle:

1. Opens a background tab with the watched URL
2. Waits for page load (10s timeout)
3. Injects `extract-element.ts` which queries the CSS selector
4. Extracts `textContent` (not innerHTML, for security)
5. Hashes the content with SHA-256
6. Compares against stored hash
7. If changed: stores new hash, sets `changedAt`, sends notification
8. Closes the background tab

After 3 consecutive extraction failures, the tab is marked as changed (to surface the problem).

## Security

- **URL validation**: `isAllowedUrl()` enforced at all `chrome.tabs.create` callsites and before storing URLs
- **Bridge lockdown**: `isLocalhostUrl()` enforced in `getBridgeUrl()`, returns null for non-localhost
- **Content script trust**: `WATCH_ELEMENT_SELECTED` uses `sender.tab.url` not `message.url`
- **CSS injection prevention**: `CSS.escape()` on all selector components
- **Attention cap**: arrays capped at 50 entries to prevent unbounded storage growth
- **Host permissions**: restricted to `http://*/*` and `https://*/*` (not `<all_urls>`)

## Tests

21 tests covering lifecycle-manager operations:

```bash
npm test -w packages/extension
```
