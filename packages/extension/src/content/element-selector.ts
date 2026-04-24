// Content script injected when user clicks "Watch tab for changes..."
// Adds hover overlay to highlight elements and captures CSS selector on click.

(function () {
  if (document.getElementById("tlm-selector-overlay")) return; // already active

  const overlay = document.createElement("div");
  overlay.id = "tlm-selector-overlay";
  overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;cursor:crosshair;";

  const highlight = document.createElement("div");
  highlight.style.cssText = "position:fixed;border:2px solid #0066cc;background:rgba(0,102,204,0.1);pointer-events:none;z-index:2147483646;display:none;transition:all 0.1s;";

  const tooltip = document.createElement("div");
  tooltip.style.cssText = "position:fixed;background:#1a1a1a;color:#fff;padding:4px 8px;border-radius:4px;font:12px monospace;z-index:2147483647;pointer-events:none;display:none;";

  document.body.appendChild(highlight);
  document.body.appendChild(tooltip);
  document.body.appendChild(overlay);

  function getCssSelector(el: Element): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts: string[] = [];
    let current: Element | null = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).slice(0, 2).map((c) => CSS.escape(c)).join(".");
        if (classes) selector += `.${classes}`;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${idx})`;
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  function cleanup(): void {
    overlay.remove();
    highlight.remove();
    tooltip.remove();
  }

  overlay.addEventListener("mousemove", (e) => {
    overlay.style.pointerEvents = "none";
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = "auto";

    if (el && el !== overlay && el !== highlight && el !== tooltip) {
      const rect = el.getBoundingClientRect();
      highlight.style.display = "block";
      highlight.style.left = `${rect.left}px`;
      highlight.style.top = `${rect.top}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      const selector = getCssSelector(el);
      tooltip.textContent = selector;
      tooltip.style.display = "block";
      tooltip.style.left = `${e.clientX + 10}px`;
      tooltip.style.top = `${e.clientY + 10}px`;
    }
  });

  overlay.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    overlay.style.pointerEvents = "none";
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = "auto";

    if (el && el !== overlay && el !== highlight && el !== tooltip) {
      const selector = getCssSelector(el);
      chrome.runtime.sendMessage({
        type: "WATCH_ELEMENT_SELECTED",
        selector,
        url: window.location.href,
        title: document.title,
        favIconUrl: (document.querySelector("link[rel*='icon']") as HTMLLinkElement)?.href,
      });
      cleanup();
    }
  });

  // ESC to cancel
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", onKeydown);
      cleanup();
    }
  }
  document.addEventListener("keydown", onKeydown);
})();
