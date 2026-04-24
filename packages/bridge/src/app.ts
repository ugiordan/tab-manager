import express from "express";
import { Storage } from "./storage.js";
import { healthRouter } from "./routes/health.js";
import { tabsRouter } from "./routes/tabs.js";
import { lifecycleRouter } from "./routes/lifecycle.js";
import { meetingRouter } from "./routes/meeting.js";
import { statsRouter } from "./routes/stats.js";
import type { Request, Response, NextFunction } from "express";
import type { WebSocketMessage } from "./types.js";

export interface AppContext {
  storage: Storage;
  broadcast?: (message: WebSocketMessage) => void;
}

export interface AppOptions {
  storageDir: string;
}

export function createApp(options: AppOptions) {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow requests with no Origin (curl, local scripts, MCP client).
    // Only block browser cross-origin requests from non-extension origins.
    if (origin && !origin.startsWith("chrome-extension://")) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    next();
  });

  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  app.use(express.json({ limit: "1mb" }));

  const storage = new Storage(options.storageDir);
  const context: AppContext = { storage };

  app.use(healthRouter());
  app.use(tabsRouter(context));
  app.use(lifecycleRouter(context));
  app.use(meetingRouter(context));
  app.use(statsRouter(context));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "internal server error" });
  });

  return { app, context };
}
