import type { ExtensionConfig } from "../types.js";

export async function updateBadge(tabCount: number, config: ExtensionConfig): Promise<void> {
  const text = tabCount.toString();
  let color: string;
  if (tabCount >= config.thresholds.alert) {
    color = "#c9190b"; // red
  } else if (tabCount >= config.thresholds.warning) {
    color = "#f0ab00"; // yellow
  } else {
    color = "#3e8635"; // green
  }

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });

  // Check attention items
  const stored = await chrome.storage.local.get("attention");
  const attention = stored.attention ?? { snoozesWoken: [], watchesChanged: [] };
  const hasAttention = attention.snoozesWoken.length > 0 || attention.watchesChanged.length > 0;

  if (hasAttention) {
    // Show attention dot by adding a small indicator to badge text
    await chrome.action.setBadgeText({ text: `${text}!` });
    await chrome.action.setBadgeBackgroundColor({ color: "#0066cc" }); // blue for attention
  }
}

export async function clearAttention(): Promise<void> {
  await chrome.storage.local.set({ attention: { snoozesWoken: [], watchesChanged: [] } });
}
