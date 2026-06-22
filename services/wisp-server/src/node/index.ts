import http from "node:http";
import { type RawData, type WebSocket, WebSocketServer } from "ws";
import { checkAuth } from "../auth";
import { resolveConfig } from "../config";
import { WispConnection } from "../connection";
import type { ClientSink } from "../transport";
import { nodeDialer } from "./dialer";

const cfg = resolveConfig(process.env);
const LOW_WATER = 1 << 19; // 512 KiB: resume paused sockets below this

const server = http.createServer((req, res) => {
  // Plain HTTP: health check / friendly message. Wisp itself is WS-only.
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("wisp-server ok\n");
    return;
  }
  res.writeHead(426, { "content-type": "text/plain" });
  res.end("upgrade required\n");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const origin = req.headers.origin ?? null;
  const subproto = (req.headers["sec-websocket-protocol"] as string | undefined)
    ?.split(",")[0]
    ?.trim();
  const token = url.searchParams.get("token") ?? subproto ?? null;

  const auth = checkAuth(cfg, { origin, token });
  if (!auth.ok) {
    socket.write(`HTTP/1.1 ${auth.status} ${auth.message}\r\n\r\n`);
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => handleConnection(ws));
});

function handleConnection(ws: WebSocket): void {
  const writableWaiters: Array<() => void> = [];
  const flushWritable = (): void => {
    if (ws.bufferedAmount < LOW_WATER && writableWaiters.length > 0) {
      const waiters = writableWaiters.splice(0);
      for (const cb of waiters) cb();
    }
  };

  const sink: ClientSink = {
    send: (frame) => {
      if (ws.readyState === ws.OPEN) ws.send(frame, () => flushWritable());
    },
    bufferedAmount: () => ws.bufferedAmount,
    onWritable: (cb) => {
      writableWaiters.push(cb);
    },
    close: () => ws.close(),
  };

  const conn = new WispConnection(sink, nodeDialer, {
    bufferSize: cfg.bufferSize,
    maxStreams: cfg.maxStreams,
  });
  conn.start();

  ws.on("message", (data: RawData, isBinary: boolean) => {
    if (!isBinary) return; // Wisp frames are always binary
    const buf = Array.isArray(data)
      ? Buffer.concat(data)
      : Buffer.from(data as Buffer);
    conn.handleMessage(
      new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
    );
  });
  ws.on("close", () => conn.destroy());
  ws.on("error", () => conn.destroy());
}

server.listen(cfg.port, () => {
  const auth = cfg.token
    ? "token"
    : cfg.allowedOrigins
      ? "origin-allowlist"
      : "OPEN";
  console.log(`wisp-server (node) listening on :${cfg.port} [auth: ${auth}]`);
});
