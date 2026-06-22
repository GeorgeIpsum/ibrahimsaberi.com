// Wisp v1 wire format. Every packet is:
//   [type: u8][streamId: u32 LE][payload...]
// All multi-byte integers are little-endian.
// Spec: https://github.com/MercuryWorkshop/wisp-protocol
//
// Runtime-agnostic: only uses Uint8Array / DataView / TextEncoder, so it runs
// unchanged under Node and Cloudflare Workers.

export const Packet = {
  CONNECT: 0x01,
  DATA: 0x02,
  CONTINUE: 0x03,
  CLOSE: 0x04,
} as const;

export const StreamType = {
  TCP: 0x01,
  UDP: 0x02,
} as const;

// Close reasons (subset of the spec we emit).
export const CloseReason = {
  UNSPECIFIED: 0x01,
  VOLUNTARY: 0x02,
  NETWORK_ERROR: 0x03,
  INVALID_INFO: 0x41,
  UNREACHABLE: 0x42,
  CONNECT_TIMEOUT: 0x43,
  REFUSED: 0x44,
  TRANSFER_TIMEOUT: 0x47,
  BLOCKED: 0x48,
  THROTTLED: 0x49,
} as const;

const HEADER = 5;

export interface Frame {
  type: number;
  streamId: number;
  payload: Uint8Array;
}

export function parseFrame(buf: Uint8Array): Frame {
  if (buf.length < HEADER) throw new Error("wisp: frame too short");
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    type: view.getUint8(0),
    streamId: view.getUint32(1, true),
    payload: buf.subarray(HEADER),
  };
}

function allocFrame(
  type: number,
  streamId: number,
  payloadLen: number,
): { buf: Uint8Array; view: DataView } {
  const buf = new Uint8Array(HEADER + payloadLen);
  const view = new DataView(buf.buffer);
  view.setUint8(0, type);
  view.setUint32(1, streamId >>> 0, true);
  return { buf, view };
}

export function encodeData(streamId: number, data: Uint8Array): Uint8Array {
  const { buf } = allocFrame(Packet.DATA, streamId, data.length);
  buf.set(data, HEADER);
  return buf;
}

export function encodeContinue(
  streamId: number,
  bufferRemaining: number,
): Uint8Array {
  const { buf, view } = allocFrame(Packet.CONTINUE, streamId, 4);
  view.setUint32(HEADER, bufferRemaining >>> 0, true);
  return buf;
}

export function encodeClose(streamId: number, reason: number): Uint8Array {
  const { buf, view } = allocFrame(Packet.CLOSE, streamId, 1);
  view.setUint8(HEADER, reason);
  return buf;
}

export interface ConnectInfo {
  streamType: number;
  port: number;
  hostname: string;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function parseConnect(payload: Uint8Array): ConnectInfo {
  if (payload.length < 3) throw new Error("wisp: CONNECT payload too short");
  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength,
  );
  return {
    streamType: view.getUint8(0),
    port: view.getUint16(1, true),
    hostname: decoder.decode(payload.subarray(3)),
  };
}

// Provided mainly for tests / a future client; the server only parses CONNECT.
export function encodeConnect(streamId: number, info: ConnectInfo): Uint8Array {
  const host = encoder.encode(info.hostname);
  const { buf, view } = allocFrame(Packet.CONNECT, streamId, 3 + host.length);
  view.setUint8(HEADER, info.streamType);
  view.setUint16(HEADER + 1, info.port, true);
  buf.set(host, HEADER + 3);
  return buf;
}
