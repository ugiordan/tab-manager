import { listByState, updateWatchStatus } from "./lifecycle-manager.js";
import { isAllowedUrl } from "../types.js";

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function extractViaFetch(
  url: string,
  cssSelector: string,
): Promise<{ content: string | null; error: string | null }> {
  if (!isAllowedUrl(url)) return { content: null, error: "URL not allowed" };
  try {
    const response = await fetch(url);
    if (!response.ok) return { content: null, error: `HTTP ${response.status}` };
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const el = doc.querySelector(cssSelector);
    if (!el) return { content: null, error: "Element not found" };
    return { content: el.textContent ?? "", error: null };
  } catch (err) {
    return { content: null, error: (err as Error).message };
  }
}

const MAX_POLLS_PER_CYCLE = 3;

export async function pollWatchedTabs(): Promise<{ tabId: string; changed: boolean }[]> {
  const watchedTabs = await listByState("watching");
  const results: { tabId: string; changed: boolean }[] = [];

  // Limit concurrent polls to avoid service worker timeout
  const eligible = watchedTabs.filter((tab) => {
    if (!tab.cssSelector) return false;
    if (tab.lastCheckedAt) {
      const intervalMs = (tab.pollIntervalMinutes ?? 30) * 60 * 1000;
      if (Date.now() - tab.lastCheckedAt < intervalMs) return false;
    }
    return true;
  }).slice(0, MAX_POLLS_PER_CYCLE);

  for (const tab of eligible) {
    const { content, error } = await extractViaFetch(tab.url, tab.cssSelector!);

    if (error || content === null) {
      const errorCount = tab.lastContentHash?.startsWith("error:")
        ? parseInt(tab.lastContentHash.split(":")[1]) + 1
        : 1;
      await updateWatchStatus(tab.id, `error:${errorCount}`, errorCount >= 3);
      results.push({ tabId: tab.id, changed: errorCount >= 3 });
      continue;
    }

    const hash = await hashString(content);
    const changed = tab.lastContentHash !== undefined && tab.lastContentHash !== null
      && !tab.lastContentHash.startsWith("error:") && tab.lastContentHash !== hash;

    await updateWatchStatus(tab.id, hash, changed);
    results.push({ tabId: tab.id, changed });
  }

  return results;
}
