import { describe, expect, it } from "vitest";
import { WispConnection } from "./connection";
import {
  CloseReason,
  encodeClose,
  encodeConnect,
  encodeData,
  Packet,
  parseFrame,
  StreamType,
} from "./protocol";
import type { Dialer, DialRequest, StreamSocket } from "./transport";

const tick = () => new Promise((r) => setTimeout(r, 0));

class FakeSocket implements StreamSocket {
  written: Uint8Array[] = [];
  paused = false;
  closeCount = 0;
  private dataCb?: (c: Uint8Array) => void;
  private closeCb?: () => void;
  private errorCb?: (e: unknown) => void;
  write(d: Uint8Array): void {
    this.written.push(d);
  }
  close(): void {
    this.closeCount += 1;
  }
  pause(): void {
    this.paused = true;
  }
  resume(): void {
    this.paused = false;
  }
  onData(cb: (c: Uint8Array) => void): void {
    this.dataCb = cb;
  }
  onClose(cb: () => void): void {
    this.closeCb = cb;
  }
  onError(cb: (e: unknown) => void): void {
    this.errorCb = cb;
  }
  emitData(c: Uint8Array): void {
    this.dataCb?.(c);
  }
  emitClose(): void {
    this.closeCb?.();
  }
  emitError(e: unknown): void {
    this.errorCb?.(e);
  }
}

function harness(
  opts: { socket?: FakeSocket; rejectDial?: boolean; bufferSize?: number } = {},
) {
  const frames: Uint8Array[] = [];
  const calls: DialRequest[] = [];
  let buffered = 0;
  let writableCb: (() => void) | null = null;
  const socket = opts.socket ?? new FakeSocket();

  const dialer: Dialer = {
    dial: (req) => {
      calls.push(req);
      return opts.rejectDial
        ? Promise.reject(new Error("nope"))
        : Promise.resolve(socket);
    },
  };

  const conn = new WispConnection(
    {
      send: (f) => frames.push(f),
      bufferedAmount: () => buffered,
      onWritable: (cb) => {
        writableCb = cb;
      },
      close: () => {},
    },
    dialer,
    { bufferSize: opts.bufferSize ?? 128 },
  );

  return {
    conn,
    frames,
    calls,
    socket,
    setBuffered: (n: number) => {
      buffered = n;
    },
    drain: () => {
      buffered = 0;
      writableCb?.();
      writableCb = null;
    },
    typed: (t: number) => frames.filter((f) => parseFrame(f).type === t),
  };
}

describe("WispConnection", () => {
  it("handshakes with CONTINUE on stream 0 advertising the window", () => {
    const h = harness({ bufferSize: 64 });
    h.conn.start();
    const f = parseFrame(h.frames[0]!);
    expect(f.type).toBe(Packet.CONTINUE);
    expect(f.streamId).toBe(0);
    expect(
      new DataView(f.payload.buffer, f.payload.byteOffset).getUint32(0, true),
    ).toBe(64);
  });

  it("dials on CONNECT and buffers DATA until the socket is ready", async () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(1, {
        streamType: StreamType.TCP,
        port: 443,
        hostname: "example.com",
      }),
    );
    h.conn.handleMessage(encodeData(1, new Uint8Array([9, 9, 9])));
    expect(h.calls[0]).toEqual({
      type: "tcp",
      hostname: "example.com",
      port: 443,
    });
    expect(h.socket.written).toHaveLength(0); // dial not resolved yet
    await tick();
    expect(h.socket.written).toHaveLength(1);
    expect([...h.socket.written[0]!]).toEqual([9, 9, 9]);
  });

  it("forwards destination data to the client as DATA frames", async () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(2, { streamType: StreamType.TCP, port: 80, hostname: "h" }),
    );
    await tick();
    h.socket.emitData(new Uint8Array([1, 2]));
    const data = h.typed(Packet.DATA);
    expect(data).toHaveLength(1);
    const f = parseFrame(data[0]!);
    expect(f.streamId).toBe(2);
    expect([...f.payload]).toEqual([1, 2]);
  });

  it("emits CLOSE when the destination closes", async () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(3, { streamType: StreamType.TCP, port: 80, hostname: "h" }),
    );
    await tick();
    h.socket.emitClose();
    const closes = h.typed(Packet.CLOSE);
    expect(closes).toHaveLength(1);
    expect(parseFrame(closes[0]!).payload[0]).toBe(CloseReason.VOLUNTARY);
  });

  it("closes the socket on client CLOSE without echoing a CLOSE frame", async () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(4, { streamType: StreamType.TCP, port: 80, hostname: "h" }),
    );
    await tick();
    h.conn.handleMessage(encodeClose(4, CloseReason.VOLUNTARY));
    expect(h.socket.closeCount).toBe(1);
    expect(h.typed(Packet.CLOSE)).toHaveLength(0);
  });

  it("rejects an unknown stream type with CLOSE invalid-info and no dial", () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(5, { streamType: 0x09, port: 80, hostname: "h" }),
    );
    expect(h.calls).toHaveLength(0);
    const closes = h.typed(Packet.CLOSE);
    expect(closes).toHaveLength(1);
    expect(parseFrame(closes[0]!).payload[0]).toBe(CloseReason.INVALID_INFO);
  });

  it("emits CLOSE unreachable when the dial fails", async () => {
    const h = harness({ rejectDial: true });
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(6, { streamType: StreamType.TCP, port: 1, hostname: "h" }),
    );
    await tick();
    const closes = h.typed(Packet.CLOSE);
    expect(closes).toHaveLength(1);
    expect(parseFrame(closes[0]!).payload[0]).toBe(CloseReason.UNREACHABLE);
  });

  it("replenishes the TCP window with CONTINUE as DATA flows", async () => {
    const h = harness({ bufferSize: 4 }); // step = 2
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(7, { streamType: StreamType.TCP, port: 80, hostname: "h" }),
    );
    await tick();
    h.conn.handleMessage(encodeData(7, new Uint8Array([0])));
    h.conn.handleMessage(encodeData(7, new Uint8Array([0]))); // hits step boundary
    const continues = h
      .typed(Packet.CONTINUE)
      .filter((f) => parseFrame(f).streamId === 7);
    expect(continues).toHaveLength(1);
  });

  it("pauses the destination under client backpressure and resumes on drain", async () => {
    const h = harness();
    h.conn.start();
    h.conn.handleMessage(
      encodeConnect(8, { streamType: StreamType.TCP, port: 80, hostname: "h" }),
    );
    await tick();
    h.setBuffered(2 << 20); // above HIGH_WATER (1 MiB)
    h.socket.emitData(new Uint8Array([1]));
    expect(h.socket.paused).toBe(true);
    h.drain();
    expect(h.socket.paused).toBe(false);
  });
});
