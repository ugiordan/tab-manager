import express from "express";
import { Storage } from "./storage.js";
import { healthRouter } from "./routes/health.js";
import { tabsRouter } from "./routes/tabs.js";
import { lifecycleRouter } from "./routes/lifecycle.js";
import { meetingRouter } from "./routes/meeting.js";
import { statsRouter } from "./routes/stats.js";
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
  app.use(express.json());

  const storage = new Storage(options.storageDir);
  const context: AppContext = { storage };

  app.use(healthRouter());
  app.use(tabsRouter(context));
  app.use(lifecycleRouter(context));
  app.use(meetingRouter(context));
  app.use(statsRouter(context));

  return { app, context };
}
