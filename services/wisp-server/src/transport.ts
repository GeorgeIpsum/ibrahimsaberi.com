// Runtime-agnostic transport seams. The portable WispConnection talks only to
// these interfaces; the Node and Worker entrypoints supply concrete impls.

export interface DialRequest {
  type: "tcp" | "udp";
  hostname: string;
  port: number;
}

/** A duplex connection to a destination host, normalized across runtimes. */
export interface StreamSocket {
  write(data: Uint8Array): void;
  close(): void;
  /** Stop emitting `onData` (TCP backpressure). */
  pause(): void;
  resume(): void;
  /** Inbound bytes from the destination (destination -> client). */
  onData(cb: (chunk: Uint8Array) => void): void;
  /** Destination closed cleanly. */
  onClose(cb: () => void): void;
  /** Destination errored. */
  onError(cb: (err: unknown) => void): void;
}

export interface Dialer {
  /** Open a socket, rejecting if the connection can't be established. */
  dial(req: DialRequest): Promise<StreamSocket>;
}

/** The client side of the WebSocket, normalized across runtimes. */
export interface ClientSink {
  send(frame: Uint8Array): void;
  /** Bytes buffered toward the client; return 0 if unknown (no backpressure). */
  bufferedAmount(): number;
  /** Register a one-shot callback fired when the send buffer drains. */
  onWritable(cb: () => void): void;
  close(): void;
}
