import http from "node:http";
import type { IncomingMessage } from "node:http";
import { type RawData, type WebSocket, WebSocketServer } from "ws";
import { checkAuth, isAuthConfigured } from "../auth";
import { resolveConfig } from "../config";
import { WispConnection } from "../connection";
import { ConnectionLimiter } from "../limits";
import type { ClientSink } from "../transport";
import { nodeDialer } from "./dialer";

const cfg = resolveConfig(process.env);
const LOW_WATER = 1 << 19; // 512 KiB: resume paused sockets below this

// Fail closed: a public deployment that forgets auth becomes a free open proxy.
if (cfg.isProduction && !isAuthConfigured(cfg) && !cfg.allowOpen) {
  console.error(
    "[wisp-server] refusing to start: NODE_ENV=production with no WISP_TOKEN " +
      "or ALLOWED_ORIGINS. Set one, or set WISP_ALLOW_OPEN=1 to override.",
  );
  process.exit(1);
}

const limiter = new ConnectionLimiter({
  maxTotal: cfg.maxConnections,
  maxPerIp: cfg.maxConnectionsPerIp,
  ratePerMin: cfg.connectRatePerMin,
});

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

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: cfg.maxPayloadBytes,
});

function remoteIp(req: IncomingMessage): string {
  // Behind a trusted proxy you may prefer X-Forwarded-For; default to the peer.
  return req.socket.remoteAddress ?? "unknown";
}

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const origin = req.headers.origin ?? null;
  const subproto = (req.headers["sec-websocket-protocol"] as string | undefined)
    ?.split(",")[0]
    ?.trim();
  // Prefer the subprotocol (kept out of URLs/logs/referrers); fall back to
  // ?token= for older clients.
  const token = subproto || url.searchParams.get("token") || null;

  const auth = checkAuth(cfg, { origin, token });
  if (!auth.ok) {
    socket.write(`HTTP/1.1 ${auth.status} ${auth.message}\r\n\r\n`);
    socket.destroy();
    return;
  }

  const ip = remoteIp(req);
  const admit = limiter.tryAdmit(ip, Date.now());
  if (!admit.ok) {
    socket.write(`HTTP/1.1 429 too many connections (${admit.reason})\r\n\r\n`);
    socket.destroy();
    return;
  }

  // ws negotiates the response subprotocol from the request automatically, so a
  // subprotocol-carried token round-trips without extra handling here.
  wss.handleUpgrade(req, socket, head, (ws) => handleConnection(ws, ip));
});

function handleConnection(ws: WebSocket, ip: string): void {
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
    udpEnabled: cfg.udpEnabled,
  });
  conn.start();

  // Idle timeout: reset on every inbound message. Plus a hard lifetime cap.
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const resetIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => ws.close(1000, "idle timeout"),
      cfg.idleTimeoutMs,
    );
  };
  const lifetimeTimer = setTimeout(
    () => ws.close(1000, "max lifetime"),
    cfg.maxLifetimeMs,
  );
  resetIdle();

  let released = false;
  const cleanup = (): void => {
    if (released) return;
    released = true;
    if (idleTimer) clearTimeout(idleTimer);
    clearTimeout(lifetimeTimer);
    limiter.release(ip);
    conn.destroy();
  };

  ws.on("message", (data: RawData, isBinary: boolean) => {
    resetIdle();
    if (!isBinary) return; // Wisp frames are always binary
    const buf = Array.isArray(data)
      ? Buffer.concat(data)
      : Buffer.from(data as Buffer);
    conn.handleMessage(
      new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength),
    );
  });
  ws.on("close", cleanup);
  ws.on("error", cleanup);
}

server.listen(cfg.port, () => {
  const auth = cfg.token
    ? "token"
    : cfg.allowedOrigins
      ? "origin-allowlist"
      : "OPEN";
  console.log(
    `wisp-server (node) listening on :${cfg.port} ` +
      `[auth: ${auth}] [udp: ${cfg.udpEnabled ? "on" : "off"}] ` +
      `[max-conn: ${cfg.maxConnections}, per-ip: ${cfg.maxConnectionsPerIp}]`,
  );
});
