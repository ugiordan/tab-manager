import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createApp } from "./app.js";
import { WebSocketManager } from "./websocket.js";

const DEFAULT_PORT = 19876;
const STORAGE_DIR = path.join(os.homedir(), ".tab-manager");
const PORT_FILE = path.join(STORAGE_DIR, "bridge.port");
const PID_FILE = path.join(STORAGE_DIR, "bridge.pid");

function cleanupStaleFiles(): void {
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
    try {
      process.kill(pid, 0);
      console.error(`Bridge already running (PID ${pid}). Exiting.`);
      process.exit(1);
    } catch {
      fs.unlinkSync(PID_FILE);
      if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
    }
  }
}

function writePidAndPort(port: number): void {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, process.pid.toString());
  fs.writeFileSync(PORT_FILE, port.toString());
}

function cleanup(): void {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
  } catch { /* best effort */ }
}

function tryListen(server: http.Server, port: number, attempts: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && attempts > 0) {
        resolve(tryListen(server, port + 1, attempts - 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, "127.0.0.1", () => resolve(port));
  });
}

async function start(): Promise<void> {
  cleanupStaleFiles();
  const { app, context } = createApp({ storageDir: STORAGE_DIR });
  const server = http.createServer(app);
  const wsManager = new WebSocketManager(server);
  context.broadcast = wsManager.broadcast.bind(wsManager);
  const port = parseInt(process.env.PORT || "", 10) || DEFAULT_PORT;

  try {
    const finalPort = await tryListen(server, port, 10);
    writePidAndPort(finalPort);
    console.log(`Tab Manager Bridge running on http://localhost:${finalPort}`);
    console.log(`WebSocket available on ws://localhost:${finalPort}`);
    console.log(`Storage: ${STORAGE_DIR}`);
  } catch (err) {
    console.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }

  process.on("SIGINT", () => { cleanup(); wsManager.close(); server.close(); process.exit(0); });
  process.on("SIGTERM", () => { cleanup(); wsManager.close(); server.close(); process.exit(0); });
}

start();
