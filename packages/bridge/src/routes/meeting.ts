import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { AppContext } from "../app.js";
import type { LifecycleTab } from "../types.js";

export function meetingRouter(context: AppContext): Router {
  const router = Router();

  router.post("/meeting/start", (_req, res) => {
    const activeTabs = context.storage.getActiveTabs();
    const meetingId = `meeting-${Date.now()}`;
    const nonPinned = activeTabs.filter((t) => !t.pinned);
    const pinned = activeTabs.filter((t) => t.pinned);

    for (const tab of nonPinned) {
      const lifecycleTab: LifecycleTab = {
        id: randomUUID(),
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        state: "snoozed",
        createdAt: Date.now(),
        originWindowId: tab.windowId,
        wakeAt: undefined,
      };
      lifecycleTab.meetingId = meetingId;
      context.storage.saveLifecycleTab(lifecycleTab);
    }

    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "snooze", meetingId } });
    }

    res.json({ meetingId, snoozedCount: nonPinned.length, pinnedKept: pinned.length });
  });

  router.post("/meeting/end", (req, res) => {
    const { meetingId } = req.body;
    if (!meetingId) {
      res.status(400).json({ error: "meetingId is required" });
      return;
    }
    const snoozed = context.storage.listLifecycleTabs("snoozed");
    const toWake = snoozed.filter((t) => t.meetingId === meetingId);

    const woken: LifecycleTab[] = [];
    for (const tab of toWake) {
      context.storage.removeLifecycleTab(tab.id);
      woken.push(tab);
    }

    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "wake", meetingId, tabs: woken } });
    }

    res.json({ wokenCount: woken.length, tabs: woken });
  });

  return router;
}
