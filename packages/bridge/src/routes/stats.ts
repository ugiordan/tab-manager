import { Router } from "express";
import type { AppContext } from "../app.js";
import type { LifecycleStats } from "../types.js";

export function statsRouter(context: AppContext): Router {
  const router = Router();

  router.get("/stats", (_req, res) => {
    const activeTabs = context.storage.getActiveTabs();
    const lifecycleTabs = context.storage.listLifecycleTabs();
    const config = context.storage.getConfig();
    const now = Date.now();
    const staleThresholdMs = config.staleMinutes * 60 * 1000;

    const tabsByWindow: Record<number, number> = {};
    const domainCounts: Record<string, number> = {};
    let staleTabs = 0;

    for (const tab of activeTabs) {
      tabsByWindow[tab.windowId] = (tabsByWindow[tab.windowId] || 0) + 1;
      if (!tab.pinned && now - tab.lastAccessed > staleThresholdMs) staleTabs++;
      try {
        const domain = new URL(tab.url).hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch { /* skip */ }
    }

    const snoozed = lifecycleTabs.filter((t) => t.state === "snoozed");
    const queued = lifecycleTabs.filter((t) => t.state === "queued");
    const watching = lifecycleTabs.filter((t) => t.state === "watching");

    const nextSnoozeWake = snoozed
      .filter((t) => t.wakeAt)
      .reduce((min, t) => (t.wakeAt! < min ? t.wakeAt! : min), Infinity);

    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats: LifecycleStats = {
      activeTabs: activeTabs.length,
      snoozedTabs: snoozed.length,
      queuedTabs: queued.length,
      watchingTabs: watching.length,
      tabsByWindow,
      staleTabs,
      topDomains,
      nextSnoozeWake: nextSnoozeWake === Infinity ? null : nextSnoozeWake,
      watchedChanges: watching.filter((t) => t.changedAt).length,
    };

    res.json(stats);
  });

  return router;
}
