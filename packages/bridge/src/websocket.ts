import { WebSocketServer, WebSocket } from "ws";
import http from "node:http";
import type { WebSocketMessage, CommandPayload } from "./types.js";

export type CommandHandler = (command: CommandPayload) => void;

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private commandHandler?: CommandHandler;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString()) as WebSocketMessage;
          if (msg.type === "command" && this.commandHandler) {
            this.commandHandler(msg.payload as CommandPayload);
          }
        } catch { /* ignore malformed */ }
      });
      ws.on("close", () => { this.clients.delete(ws); });
    });
  }

  onCommand(handler: CommandHandler): void {
    this.commandHandler = handler;
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
