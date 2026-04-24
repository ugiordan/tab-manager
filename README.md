# Tab Manager

A Chrome tab management system with AI-powered cleanup via Claude Code.

## Components

- **Chrome Extension**: popup UI with tab hygiene monitoring, meeting mode, and auto-grouping (React + PatternFly 5)
- **Bridge Server**: local Node.js server providing REST API and WebSocket for real-time communication
- **MCP Plugin**: Claude Code integration for AI-powered tab analysis and management

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the bridge server

```bash
npm run bridge:start
```

### 3. Load the Chrome extension

1. Run `npm run build -w packages/extension`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/extension/dist/`

### 4. Configure Claude Code MCP (optional)

Add to your Claude Code settings:

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

## MCP Tools

| Tool | Description |
|------|-------------|
| `tabs_list` | List all open tabs with activity info |
| `tabs_close` | Close specific tabs by ID |
| `tabs_save` | Save current session |
| `tabs_restore` | Restore a saved session |
| `tabs_meeting_mode` | Save tabs and close non-pinned for a call |
| `tabs_cleanup` | AI-powered tab analysis and cleanup suggestions |
| `tabs_group` | Group tabs by domain |
| `tabs_stats` | Tab count and hygiene summary |

## Development

```bash
npm run bridge:dev          # Bridge with hot reload
npm run dev -w packages/extension  # Extension with watch mode
npm test                    # Run all tests
```
