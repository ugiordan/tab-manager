# Configuration

## Extension Settings

Open the options page from `chrome://extensions/` > Tab Lifecycle Manager > **Details** > **Extension options**.

| Setting | Default | Description |
|---------|---------|-------------|
| Warning threshold | 30 | Badge turns yellow at this tab count |
| Alert threshold | 50 | Badge turns red at this tab count |
| Stale tab threshold | 120 min | Tabs inactive longer than this are flagged |
| Default snooze duration | 60 min | Used when no specific time is selected |
| Watch poll interval | 30 min | How often watched tabs are checked |
| Bridge server URL | `http://localhost:19876` | Must be localhost or 127.0.0.1 |

!!! warning "Bridge URL restriction"
    The bridge URL is validated to only accept `localhost` or `127.0.0.1` to prevent SSRF. This cannot be changed to a remote server.

## Badge Behavior

The extension badge shows the active tab count with color thresholds:

- **Green**: below warning threshold
- **Yellow**: between warning and alert
- **Red**: above alert threshold
- **Dot overlay**: when a snoozed tab woke up or a watched page changed

Click **Clear** in the popup to dismiss attention indicators.

## Bridge Server

The bridge server reads its configuration from `~/.tab-manager/config.json`:

```json
{
  "thresholds": { "warning": 30, "alert": 50 },
  "staleMinutes": 120,
  "defaultPollIntervalMinutes": 30,
  "defaultSnoozeDurationMinutes": 60
}
```

The server binds to `127.0.0.1:19876`. If that port is taken, it tries up to 10 consecutive ports.

## MCP Plugin

Set the `BRIDGE_URL` environment variable when configuring the MCP server:

```json
{
  "mcpServers": {
    "tab-manager": {
      "command": "node",
      "args": ["<path>/packages/mcp/dist/index.js"],
      "env": {
        "BRIDGE_URL": "http://localhost:19876"
      }
    }
  }
}
```

`BRIDGE_URL` must point to localhost or 127.0.0.1.
