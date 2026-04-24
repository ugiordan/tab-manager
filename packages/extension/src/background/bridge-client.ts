import { DEFAULT_EXTENSION_CONFIG, TrackedTab, LifecycleTab, isLocalhostUrl, isAllowedUrl } from "../types.js";
import { wakeTab } from "./lifecycle-manager.js";

let ws: WebSocket | null = null;
let reconnectDelay = 5000;
const MAX_RECONNECT_DELAY = 300000; // 5 minutes

function scheduleReconnect(): void {
  setTimeout(connectWebSocket, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
}

export async function connectWebSocket(): Promise<void> {
  const bridgeUrl = await getBridgeUrl();
  if (!bridgeUrl) return;
  const wsUrl = bridgeUrl.replace(/^http/, "ws") + "/ws";

  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log("Connected to bridge");
      reconnectDelay = 5000; // reset on successful connection
    };
    ws.onclose = () => {
      console.log("Disconnected from bridge");
      scheduleReconnect();
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "command") {
          handleBridgeCommand(msg.payload);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
  } catch (err) {
    console.error("Failed to connect to bridge:", err);
    scheduleReconnect();
  }
}

async function handleBridgeCommand(payload: any): Promise<void> {
  if (payload.command === "wake" && payload.lifecycleIds) {
    for (const id of payload.lifecycleIds) {
      const tab = await wakeTab(id);
      if (tab && isAllowedUrl(tab.url)) {
        try {
          await chrome.tabs.create({ url: tab.url, windowId: tab.originWindowId });
        } catch {
          await chrome.tabs.create({ url: tab.url });
        }
      }
    }
  }
}

export function sendToBridge(message: unknown): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export async function getBridgeUrl(): Promise<string | null> {
  const stored = await chrome.storage.local.get("config");
  const config = stored.config ?? DEFAULT_EXTENSION_CONFIG;
  if (!isLocalhostUrl(config.bridgeUrl)) return null;
  return config.bridgeUrl;
}

export async function isBridgeAvailable(): Promise<boolean> {
  try {
    const bridgeUrl = await getBridgeUrl();
    if (!bridgeUrl) return false;
    const response = await fetch(`${bridgeUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendTabsUpdate(tabs: TrackedTab[]): Promise<void> {
  const bridgeUrl = await getBridgeUrl();
  if (!bridgeUrl) return;
  try {
    await fetch(`${bridgeUrl}/tabs/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabs }),
    });
  } catch (err) {
    console.error("Failed to sync tabs to bridge:", err);
  }
}

export async function sendLifecycleSync(activeTabs: TrackedTab[], lifecycleTabs: LifecycleTab[]): Promise<void> {
  sendToBridge({
    type: "state-sync",
    payload: { activeTabs, lifecycleTabs },
  });
}
