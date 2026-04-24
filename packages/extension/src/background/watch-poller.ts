import { listByState, updateWatchStatus } from "./lifecycle-manager.js";
import { isAllowedUrl } from "../types.js";

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function extractViaContentScript(
  url: string,
  cssSelector: string,
  lifecycleId: string
): Promise<{ content: string | null; error: string | null }> {
  // Open the page in a background tab, inject content script to extract element
  if (!isAllowedUrl(url)) return { content: null, error: "URL not allowed" };
  let tabId: number | undefined;
  try {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;
    if (!tabId) return { content: null, error: "Failed to create tab" };

    // Wait for the tab to finish loading
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error("Tab load timeout"));
      }, 30000);

      function listener(updatedTabId: number, info: chrome.tabs.TabChangeInfo) {
        if (updatedTabId === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timeout);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Inject params then the extraction script
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (selector: string, id: string) => {
        (globalThis as any).__extractElementParams = { selector, lifecycleId: id };
      },
      args: [cssSelector, lifecycleId],
    });

    // Collect the result via a one-shot message listener
    const result = await new Promise<{ content: string | null; error: string | null }>((resolve) => {
      const timeout = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        resolve({ content: null, error: "Extraction timeout" });
      }, 10000);

      function listener(message: any) {
        if (message.type === "WATCH_EXTRACT_RESULT" && message.lifecycleId === lifecycleId) {
          chrome.runtime.onMessage.removeListener(listener);
          clearTimeout(timeout);
          resolve({ content: message.content, error: message.error });
        }
      }
      chrome.runtime.onMessage.addListener(listener);

      chrome.scripting.executeScript({
        target: { tabId: tabId! },
        files: ["content/extract-element.js"],
      });
    });

    return result;
  } catch (err) {
    return { content: null, error: (err as Error).message };
  } finally {
    if (tabId) {
      try { await chrome.tabs.remove(tabId); } catch { /* tab may already be closed */ }
    }
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
    const { content, error } = await extractViaContentScript(tab.url, tab.cssSelector!, tab.id);

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
