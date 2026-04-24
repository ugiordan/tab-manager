import { WebSocketServer, WebSocket } from "ws";
import http from "node:http";
import type { WebSocketMessage, CommandPayload, ActiveTab, LifecycleTab } from "./types.js";

export type CommandHandler = (command: CommandPayload) => void;
export type SyncHandler = (payload: { activeTabs?: ActiveTab[]; lifecycleTabs?: LifecycleTab[] }) => void;

const MAX_CONNECTIONS = 10;

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private commandHandler?: CommandHandler;
  private syncHandler?: SyncHandler;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws) => {
      if (this.clients.size >= MAX_CONNECTIONS) {
        ws.close(1013, "Too many connections");
        return;
      }
      this.clients.add(ws);
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString()) as WebSocketMessage;
          if (msg.type === "command" && this.commandHandler) {
            this.commandHandler(msg.payload as CommandPayload);
          }
          if (msg.type === "state-sync" && msg.payload && this.syncHandler) {
            this.syncHandler(msg.payload as { activeTabs?: ActiveTab[]; lifecycleTabs?: LifecycleTab[] });
          }
        } catch { /* ignore malformed */ }
      });
      ws.on("close", () => { this.clients.delete(ws); });
    });
  }

  onCommand(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  onSync(handler: SyncHandler): void {
    this.syncHandler = handler;
  }

  get clientCount(): number { return this.clients.size; }

  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    }
  }

  close(): void {
    for (const client of this.clients) client.close();
    this.wss.close();
  }
}
