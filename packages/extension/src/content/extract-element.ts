// Content script injected by watch poller to extract a CSS-selected element's content.
// Returns the element's innerHTML or an error via messaging.

(async function () {
  const params = (globalThis as any).__extractElementParams as
    | { selector: string; lifecycleId: string }
    | undefined;

  if (!params) return;

  try {
    const el = document.querySelector(params.selector);
    if (!el) {
      chrome.runtime.sendMessage({
        type: "WATCH_EXTRACT_RESULT",
        lifecycleId: params.lifecycleId,
        content: null,
        error: "Element not found (selector may be stale)",
      });
      return;
    }

    chrome.runtime.sendMessage({
      type: "WATCH_EXTRACT_RESULT",
      lifecycleId: params.lifecycleId,
      content: el.textContent,
      error: null,
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: "WATCH_EXTRACT_RESULT",
      lifecycleId: params.lifecycleId,
      content: null,
      error: (err as Error).message,
    });
  }
})();
