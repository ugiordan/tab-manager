# Installation

## Prerequisites

- **Node.js** 18+ and npm
- **Chrome** or Chromium-based browser
- **Claude Code** (optional, for MCP integration)

## Clone and Install

```bash
git clone https://github.com/ugiordan/tab-manager.git
cd tab-manager
npm install
```

This installs all three packages (bridge, extension, MCP) via npm workspaces.

## Build the Extension

```bash
npm run build -w packages/extension
```

This runs webpack and outputs the built extension to `packages/extension/dist/`.

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `packages/extension/dist/` directory

The extension icon should appear in your toolbar. Click it to open the popup.

!!! tip "Reloading after changes"
    After rebuilding, go to `chrome://extensions/` and click the refresh icon on the Tab Lifecycle Manager card. No need to remove and re-add.

## Start the Bridge Server (Optional)

The bridge server is only needed if you want MCP tool access from Claude Code. The extension works fully standalone without it.

```bash
npm run bridge:start
```

The server starts on `http://localhost:19876`. It stores data in `~/.tab-manager/`.

## Development Mode

```bash
# Bridge with hot reload
npm run bridge:dev

# Extension with watch mode (rebuilds on file changes)
npm run dev -w packages/extension

# Run all tests
npm test
```
