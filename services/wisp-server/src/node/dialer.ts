import dgram from "node:dgram";
import net from "node:net";
import type { Dialer, DialRequest, StreamSocket } from "../transport";

function toU8(b: Buffer): Uint8Array {
  return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
}

function tcp(req: DialRequest): Promise<StreamSocket> {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: req.hostname, port: req.port });
    sock.once("error", reject); // pre-connect failure rejects the dial

    sock.once("connect", () => {
      sock.removeListener("error", reject);

      let onData: ((c: Uint8Array) => void) | null = null;
      let onClose: (() => void) | null = null;
      let onError: ((e: unknown) => void) | null = null;
      const early: Uint8Array[] = [];
      let closed = false;

      sock.on("data", (b: Buffer) => {
        const u = toU8(b);
        if (onData) onData(u);
        else early.push(u);
      });
      sock.on("close", () => {
        closed = true;
        onClose?.();
      });
      sock.on("error", (e) => onError?.(e));

      resolve({
        write: (d) => void sock.write(d),
        close: () => sock.destroy(),
        pause: () => void sock.pause(),
        resume: () => void sock.resume(),
        onData: (cb) => {
          onData = cb;
          for (const u of early) cb(u);
          early.length = 0;
        },
        onClose: (cb) => {
          onClose = cb;
          if (closed) cb();
        },
        onError: (cb) => {
          onError = cb;
        },
      });
    });
  });
}

function udp(req: DialRequest): Promise<StreamSocket> {
  return new Promise((resolve, reject) => {
    const family = net.isIPv6(req.hostname) ? "udp6" : "udp4";
    const sock = dgram.createSocket(family);
    let onData: ((c: Uint8Array) => void) | null = null;
    let onClose: (() => void) | null = null;
    let onError: ((e: unknown) => void) | null = null;
    const early: Uint8Array[] = [];
    let closed = false;

    sock.on("message", (b: Buffer) => {
      const u = toU8(b);
      if (onData) onData(u);
      else early.push(u);
    });
    sock.on("close", () => {
      closed = true;
      onClose?.();
    });
    sock.once("error", reject);

    sock.connect(req.port, req.hostname, () => {
      sock.removeListener("error", reject);
      sock.on("error", (e) => onError?.(e));
      resolve({
        write: (d) => sock.send(d),
        close: () => sock.close(),
        pause: () => {}, // datagram sockets have no readable backpressure
        resume: () => {},
        onData: (cb) => {
          onData = cb;
          for (const u of early) cb(u);
          early.length = 0;
        },
        onClose: (cb) => {
          onClose = cb;
          if (closed) cb();
        },
        onError: (cb) => {
          onError = cb;
        },
      });
    });
  });
}

export const nodeDialer: Dialer = {
  dial: (req) => (req.type === "udp" ? udp(req) : tcp(req)),
};
