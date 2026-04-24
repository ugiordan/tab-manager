import { Router } from "express";
import type { AppContext } from "../app.js";

export function tabsRouter(context: AppContext): Router {
  const router = Router();

  router.get("/tabs", (_req, res) => {
    const tabs = context.storage.getActiveTabs();
    res.json({ tabs });
  });

  router.post("/tabs/sync", (req, res) => {
    const { tabs } = req.body;
    if (!Array.isArray(tabs)) {
      res.status(400).json({ error: "tabs must be an array" });
      return;
    }
    context.storage.saveActiveTabs(tabs);
    if (context.broadcast) {
      context.broadcast({ type: "tabs-update", payload: tabs });
    }
    res.json({ synced: tabs.length });
  });

  return router;
}
