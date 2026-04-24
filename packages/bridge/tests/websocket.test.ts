import { describe, it, expect, afterEach } from "vitest";
import http from "node:http";
import { WebSocket } from "ws";
import { WebSocketManager } from "../src/websocket.js";

describe("WebSocketManager", () => {
  let server: http.Server;
  let wsManager: WebSocketManager;

  afterEach(() => {
    wsManager?.close();
    server?.close();
  });

  function startServer(): Promise<number> {
    return new Promise((resolve) => {
      server = http.createServer();
      wsManager = new WebSocketManager(server);
      server.listen(0, () => {
        const addr = server.address() as { port: number };
        resolve(addr.port);
      });
    });
  }

  function connectClient(port: number): Promise<WebSocket> {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      ws.on("open", () => resolve(ws));
    });
  }

  it("tracks connected clients", async () => {
    const port = await startServer();
    expect(wsManager.clientCount).toBe(0);
    const client = await connectClient(port);
    expect(wsManager.clientCount).toBe(1);
    client.close();
  });

  it("broadcasts messages to all clients", async () => {
    const port = await startServer();
    const client1 = await connectClient(port);
    const client2 = await connectClient(port);

    const messages: string[] = [];
    client1.on("message", (data) => messages.push(data.toString()));
    client2.on("message", (data) => messages.push(data.toString()));

    wsManager.broadcast({ type: "state-change", payload: { action: "snooze" } });

    await new Promise((r) => setTimeout(r, 100));
    expect(messages).toHaveLength(2);
    expect(JSON.parse(messages[0]).type).toBe("state-change");

    client1.close();
    client2.close();
  });

  it("handles incoming command messages", async () => {
    const port = await startServer();
    const client = await connectClient(port);

    let received: any = null;
    wsManager.onCommand((cmd) => { received = cmd; });

    client.send(JSON.stringify({ type: "command", payload: { command: "wake", lifecycleIds: ["abc"] } }));

    await new Promise((r) => setTimeout(r, 100));
    expect(received).not.toBeNull();
    expect(received.command).toBe("wake");
    expect(received.lifecycleIds).toEqual(["abc"]);

    client.close();
  });
});
