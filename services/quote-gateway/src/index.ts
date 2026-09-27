import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { parseClientMessage, type ServerMessage } from "./protocol.js";
import { DemoSource, FugleSource, type QuoteSource } from "./sources.js";

// 讀取 repo 根目錄的 .env
const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../../.env") });

const port = Number(process.env.QUOTE_GATEWAY_PORT ?? 8787);
const apiKey = process.env.FUGLE_API_KEY;
const source: QuoteSource = apiKey ? new FugleSource(apiKey) : new DemoSource();

/** 每個瀏覽器連線訂閱了哪些代號 */
const clients = new Map<WebSocket, Set<string>>();
let lastStatus: ServerMessage | null = null;

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg: ServerMessage) {
  if (msg.type === "status") {
    lastStatus = msg;
    for (const ws of clients.keys()) send(ws, msg);
    return;
  }
  for (const [ws, symbols] of clients) {
    if (symbols.has(msg.symbol)) send(ws, msg);
  }
}

const wss = new WebSocketServer({ port });

wss.on("connection", (ws) => {
  clients.set(ws, new Set());
  if (lastStatus) send(ws, lastStatus);

  ws.on("message", async (raw) => {
    const msg = parseClientMessage(raw.toString());
    if (!msg) return;
    const set = clients.get(ws)!;
    msg.symbols.forEach((s) => set.add(s));
    await source.subscribe(msg.symbols);
  });

  ws.on("close", () => clients.delete(ws));
});

await source.start(broadcast);
console.log(`[quote-gateway] ws://localhost:${port}（來源：${source.name}）`);
