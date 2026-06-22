import { connect } from "cloudflare:sockets";
import { checkAuth } from "../auth";
import { resolveConfig } from "../config";
import { WispConnection } from "../connection";
import type { Dialer, DialRequest, StreamSocket } from "../transport";

// Cloudflare Workers TCP egress. UDP is unsupported on Workers, so UDP CONNECT
// requests reject here and the connection replies with CLOSE 0x41 (invalid).
const workerDialer: Dialer = {
  async dial(req: DialRequest): Promise<StreamSocket> {
    if (req.type !== "tcp") throw new Error("udp not supported on workers");
    const socket = connect({ hostname: req.hostname, port: req.port });
    await socket.opened; // rejects if the connection fails
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();

    // Held in an object so the reader IIFE below doesn't get its captures
    // narrowed to `never` (TS narrows a `let x = null` inside an IIFE).
    const cb: {
      data: ((c: Uint8Array) => void) | null;
      close: (() => void) | null;
      error: ((e: unknown) => void) | null;
    } = { data: null, close: null, error: null };
    const early: Uint8Array[] = [];
    let closed = false;

    // Awaiting each read provides natural backpressure from the destination.
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const u: Uint8Array = value;
          if (cb.data) cb.data(u);
          else early.push(u);
        }
        closed = true;
        cb.close?.();
      } catch (e) {
        closed = true;
        cb.error?.(e);
      }
    })();

    return {
      write: (d) => void writer.write(d).catch(() => {}),
      close: () => {
        closed = true;
        void socket.close().catch(() => {});
      },
      // Workers don't expose WS bufferedAmount, so the connection never pauses;
      // the awaited reader loop is the backpressure we have.
      pause: () => {},
      resume: () => {},
      onData: (fn) => {
        cb.data = fn;
        for (const u of early) fn(u);
        early.length = 0;
      },
      onClose: (fn) => {
        cb.close = fn;
        if (closed) fn();
      },
      onError: (fn) => {
        cb.error = fn;
      },
    };
  },
};

type Env = Record<string, string | undefined>;

export default {
  fetch(request: Request, env: Env): Response {
    const cfg = resolveConfig(env);
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") !== "websocket") {
      if (url.pathname === "/health" || url.pathname === "/") {
        return new Response("wisp-server ok\n", {
          headers: { "content-type": "text/plain" },
        });
      }
      return new Response("upgrade required\n", { status: 426 });
    }

    const origin = request.headers.get("origin");
    const token =
      url.searchParams.get("token") ??
      request.headers.get("sec-websocket-protocol");
    const auth = checkAuth(cfg, { origin, token });
    if (!auth.ok) return new Response(auth.message, { status: auth.status });

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const encoder = new TextEncoder();
    const conn = new WispConnection(
      {
        send: (frame) => {
          try {
            server.send(frame);
          } catch {
            // socket closed mid-send; nothing to do
          }
        },
        bufferedAmount: () => 0,
        onWritable: () => {},
        close: () => {
          try {
            server.close();
          } catch {
            // already closed
          }
        },
      },
      workerDialer,
      { bufferSize: cfg.bufferSize, maxStreams: cfg.maxStreams },
    );
    conn.start();

    server.addEventListener("message", (event: MessageEvent) => {
      const d = event.data;
      const bytes =
        typeof d === "string"
          ? encoder.encode(d)
          : new Uint8Array(d as ArrayBuffer);
      conn.handleMessage(bytes);
    });
    server.addEventListener("close", () => conn.destroy());
    server.addEventListener("error", () => conn.destroy());

    return new Response(null, { status: 101, webSocket: client });
  },
};
