import { EgressBlockedError } from "./egress-guard";
import {
  CloseReason,
  encodeClose,
  encodeContinue,
  encodeData,
  Packet,
  parseConnect,
  parseFrame,
  StreamType,
} from "./protocol";
import type { ClientSink, Dialer, StreamSocket } from "./transport";

// Bytes buffered toward the client before we pause the destination socket.
const HIGH_WATER = 1 << 20; // 1 MiB

/** A dialer may attach a wispCloseReason to its rejection; default UNREACHABLE. */
function closeReasonFor(err: unknown): number {
  if (err instanceof EgressBlockedError) return err.wispCloseReason;
  const r = (err as { wispCloseReason?: unknown } | null)?.wispCloseReason;
  return typeof r === "number" ? r : CloseReason.UNREACHABLE;
}

interface StreamState {
  id: number;
  type: number;
  socket: StreamSocket | null;
  closed: boolean;
  /** DATA packets received since the last CONTINUE (TCP flow control). */
  received: number;
  /** DATA buffered while the dial is still in flight. */
  pending: Uint8Array[];
}

export interface ConnectionOptions {
  bufferSize?: number;
  maxStreams?: number;
  /** Allow UDP CONNECT streams. Default false (UDP is a relay/amplification risk). */
  udpEnabled?: boolean;
}

/**
 * One client WebSocket ⇄ many destination sockets, multiplexed per the Wisp v1
 * protocol. Fully runtime-agnostic: it depends only on a ClientSink and a
 * Dialer, so the same logic backs both the Node server and the Worker.
 */
export class WispConnection {
  private readonly streams = new Map<number, StreamState>();
  private readonly bufferSize: number;
  private readonly maxStreams: number;
  private readonly udpEnabled: boolean;
  private readonly paused = new Set<StreamSocket>();
  private writableHooked = false;
  private destroyed = false;

  constructor(
    private readonly sink: ClientSink,
    private readonly dialer: Dialer,
    opts: ConnectionOptions = {},
  ) {
    this.bufferSize = opts.bufferSize ?? 128;
    this.maxStreams = opts.maxStreams ?? 512;
    this.udpEnabled = opts.udpEnabled ?? false;
  }

  /** Handshake: advertise the initial per-stream window on stream 0. */
  start(): void {
    this.sink.send(encodeContinue(0, this.bufferSize));
  }

  /** Feed one binary WebSocket message from the client. */
  handleMessage(data: Uint8Array): void {
    if (this.destroyed) return;
    let frame: ReturnType<typeof parseFrame>;
    try {
      frame = parseFrame(data);
    } catch {
      return; // ignore malformed frames
    }
    switch (frame.type) {
      case Packet.CONNECT:
        this.onConnect(frame.streamId, frame.payload);
        break;
      case Packet.DATA:
        this.onData(frame.streamId, frame.payload);
        break;
      case Packet.CLOSE:
        this.onClientClose(frame.streamId);
        break;
      // CONTINUE is server -> client only; ignore inbound.
      default:
        break;
    }
  }

  /** Client WebSocket closed: tear down every destination socket. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const state of this.streams.values()) {
      state.closed = true;
      state.socket?.close();
    }
    this.streams.clear();
    this.paused.clear();
  }

  private onConnect(id: number, payload: Uint8Array): void {
    if (id === 0 || this.streams.has(id)) return;
    if (this.streams.size >= this.maxStreams) {
      this.sink.send(encodeClose(id, CloseReason.THROTTLED));
      return;
    }

    let info: ReturnType<typeof parseConnect>;
    try {
      info = parseConnect(payload);
    } catch {
      this.sink.send(encodeClose(id, CloseReason.INVALID_INFO));
      return;
    }
    if (
      info.streamType !== StreamType.TCP &&
      info.streamType !== StreamType.UDP
    ) {
      this.sink.send(encodeClose(id, CloseReason.INVALID_INFO));
      return;
    }
    if (info.streamType === StreamType.UDP && !this.udpEnabled) {
      this.sink.send(encodeClose(id, CloseReason.BLOCKED));
      return;
    }

    const state: StreamState = {
      id,
      type: info.streamType,
      socket: null,
      closed: false,
      received: 0,
      pending: [],
    };
    this.streams.set(id, state);

    this.dialer
      .dial({
        type: info.streamType === StreamType.TCP ? "tcp" : "udp",
        hostname: info.hostname,
        port: info.port,
      })
      .then((socket) => {
        if (state.closed) {
          socket.close();
          return;
        }
        state.socket = socket;
        socket.onData((chunk) => this.fromDestination(state, chunk));
        socket.onClose(() => this.teardown(state, CloseReason.VOLUNTARY, true));
        socket.onError(() =>
          this.teardown(state, CloseReason.NETWORK_ERROR, true),
        );
        for (const buffered of state.pending) socket.write(buffered);
        state.pending = [];
      })
      .catch((err) => this.teardown(state, closeReasonFor(err), true));
  }

  private onData(id: number, payload: Uint8Array): void {
    const state = this.streams.get(id);
    if (!state || state.closed) return;

    // Copy: the payload may be a view into a buffer the transport reuses.
    const data = payload.slice();
    if (state.socket) state.socket.write(data);
    else state.pending.push(data);

    // TCP flow control: replenish the client's window before it's exhausted.
    if (state.type === StreamType.TCP) {
      state.received += 1;
      const step = Math.max(1, this.bufferSize >> 1);
      if (state.received % step === 0) {
        this.sink.send(encodeContinue(id, this.bufferSize));
      }
    }
  }

  private onClientClose(id: number): void {
    const state = this.streams.get(id);
    if (state) this.teardown(state, CloseReason.VOLUNTARY, false);
  }

  /** Destination produced data: forward to client, applying backpressure. */
  private fromDestination(state: StreamState, chunk: Uint8Array): void {
    if (state.closed) return;
    this.sink.send(encodeData(state.id, chunk));
    if (state.socket && this.sink.bufferedAmount() > HIGH_WATER) {
      state.socket.pause();
      this.paused.add(state.socket);
      this.hookWritable();
    }
  }

  private hookWritable(): void {
    if (this.writableHooked) return;
    this.writableHooked = true;
    this.sink.onWritable(() => {
      this.writableHooked = false;
      const waiters = [...this.paused];
      this.paused.clear();
      for (const socket of waiters) socket.resume();
    });
  }

  private teardown(
    state: StreamState,
    reason: number,
    notifyClient: boolean,
  ): void {
    if (state.closed) return;
    state.closed = true;
    this.streams.delete(state.id);
    if (state.socket) {
      this.paused.delete(state.socket);
      state.socket.close();
    }
    if (notifyClient && !this.destroyed) {
      this.sink.send(encodeClose(state.id, reason));
    }
  }
}
