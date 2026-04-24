import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { AppContext } from "../app.js";
import type { LifecycleTab } from "../types.js";

export function meetingRouter(context: AppContext): Router {
  const router = Router();

  router.post("/meeting/start", async (_req, res) => {
    // Check for an already-active meeting (any snoozed tab with a meetingId)
    const existingMeetingTabs = context.storage.listLifecycleTabs("snoozed").filter(t => t.meetingId);
    if (existingMeetingTabs.length > 0) {
      res.status(409).json({ error: "A meeting is already active", meetingId: existingMeetingTabs[0].meetingId });
      return;
    }

    const activeTabs = context.storage.getActiveTabs();
    const meetingId = `meeting-${randomUUID()}`;
    const nonPinned = activeTabs.filter((t) => !t.pinned);
    const pinned = activeTabs.filter((t) => t.pinned);

    const lifecycleTabs: LifecycleTab[] = nonPinned.map((tab) => ({
      id: randomUUID(),
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      state: "snoozed" as const,
      createdAt: Date.now(),
      originWindowId: tab.windowId,
      wakeAt: undefined,
      meetingId,
    }));

    await context.storage.bulkSaveLifecycleTabs(lifecycleTabs);

    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "snooze", meetingId } });
      context.broadcast({ type: "command", payload: { command: "meeting-start", meetingId } });
    }

    res.json({ meetingId, snoozedCount: nonPinned.length, pinnedKept: pinned.length });
  });

  router.post("/meeting/end", async (req, res) => {
    const { meetingId } = req.body;
    if (!meetingId) {
      res.status(400).json({ error: "meetingId is required" });
      return;
    }
    const snoozed = context.storage.listLifecycleTabs("snoozed");
    const toWake = snoozed.filter((t) => t.meetingId === meetingId);

    const woken: LifecycleTab[] = [];
    for (const tab of toWake) {
      await context.storage.removeLifecycleTab(tab.id);
      woken.push(tab);
    }

    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "wake", meetingId, tabs: woken } });
      context.broadcast({ type: "command", payload: { command: "meeting-end", meetingId, lifecycleIds: woken.map(t => t.id) } });
    }

    res.json({ wokenCount: woken.length, tabs: woken });
  });

  return router;
}
