import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { AppContext } from "../app.js";
import type { LifecycleState, LifecycleTab } from "../types.js";

const VALID_STATES: LifecycleState[] = ["snoozed", "queued", "watching"];

export function lifecycleRouter(context: AppContext): Router {
  const router = Router();

  router.get("/lifecycle", (_req, res) => {
    const tabs = context.storage.listLifecycleTabs();
    res.json({ tabs });
  });

  router.get("/lifecycle/:state", (req, res) => {
    const state = req.params.state as LifecycleState;
    if (!VALID_STATES.includes(state)) {
      res.status(400).json({ error: "invalid state" });
      return;
    }
    const tabs = context.storage.listLifecycleTabs(state);
    res.json({ tabs });
  });

  router.post("/lifecycle/snooze", (req, res) => {
    const { url, title, favIconUrl, wakeAt, originWindowId } = req.body;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    const tab: LifecycleTab = {
      id: randomUUID(),
      url,
      title: title || "",
      favIconUrl,
      state: "snoozed",
      createdAt: Date.now(),
      originWindowId: originWindowId || 0,
      wakeAt,
    };
    context.storage.saveLifecycleTab(tab);
    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "snooze", tab } });
    }
    res.status(201).json({ tab });
  });

  router.post("/lifecycle/queue", (req, res) => {
    const { url, title, favIconUrl, originWindowId } = req.body;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    const queuedTabs = context.storage.listLifecycleTabs("queued");
    const maxPosition = queuedTabs.reduce((max, t) => Math.max(max, t.position ?? -1), -1);
    const tab: LifecycleTab = {
      id: randomUUID(),
      url,
      title: title || "",
      favIconUrl,
      state: "queued",
      createdAt: Date.now(),
      originWindowId: originWindowId || 0,
      position: maxPosition + 1,
    };
    context.storage.saveLifecycleTab(tab);
    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "queue", tab } });
    }
    res.status(201).json({ tab });
  });

  router.post("/lifecycle/watch", (req, res) => {
    const { url, title, favIconUrl, cssSelector, pollIntervalMinutes, originWindowId } = req.body;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    if (!cssSelector) {
      res.status(400).json({ error: "cssSelector is required" });
      return;
    }
    const config = context.storage.getConfig();
    const tab: LifecycleTab = {
      id: randomUUID(),
      url,
      title: title || "",
      favIconUrl,
      state: "watching",
      createdAt: Date.now(),
      originWindowId: originWindowId || 0,
      cssSelector,
      pollIntervalMinutes: pollIntervalMinutes || config.defaultPollIntervalMinutes,
    };
    context.storage.saveLifecycleTab(tab);
    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "watch", tab } });
    }
    res.status(201).json({ tab });
  });

  router.post("/lifecycle/:id/wake", (req, res) => {
    const { id } = req.params;
    const tab = context.storage.getLifecycleTab(id);
    if (!tab) {
      res.status(404).json({ error: "tab not found" });
      return;
    }
    context.storage.removeLifecycleTab(id);
    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "wake", tab } });
    }
    res.json({ tab });
  });

  router.delete("/lifecycle/:id", (req, res) => {
    const { id } = req.params;
    const tab = context.storage.getLifecycleTab(id);
    if (!tab) {
      res.status(404).json({ error: "tab not found" });
      return;
    }
    context.storage.removeLifecycleTab(id);
    if (context.broadcast) {
      context.broadcast({ type: "state-change", payload: { action: "remove", tab } });
    }
    res.json({ removed: true });
  });

  return router;
}
