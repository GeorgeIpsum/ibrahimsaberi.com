import { describe, expect, it } from "vitest";
import {
  CloseReason,
  encodeClose,
  encodeConnect,
  encodeContinue,
  encodeData,
  Packet,
  parseConnect,
  parseFrame,
  StreamType,
} from "./protocol";

describe("wisp protocol framing", () => {
  it("round-trips a DATA frame with little-endian stream id", () => {
    const body = new Uint8Array([1, 2, 3, 4, 5]);
    const frame = encodeData(0x01020304, body);
    // header: type=DATA, then streamId LE
    expect(frame[0]).toBe(Packet.DATA);
    expect([frame[1], frame[2], frame[3], frame[4]]).toEqual([
      0x04, 0x03, 0x02, 0x01,
    ]);
    const parsed = parseFrame(frame);
    expect(parsed.type).toBe(Packet.DATA);
    expect(parsed.streamId).toBe(0x01020304);
    expect([...parsed.payload]).toEqual([...body]);
  });

  it("encodes CONTINUE with a u32 LE buffer-remaining", () => {
    const frame = encodeContinue(7, 128);
    const parsed = parseFrame(frame);
    expect(parsed.type).toBe(Packet.CONTINUE);
    expect(parsed.streamId).toBe(7);
    const view = new DataView(parsed.payload.buffer, parsed.payload.byteOffset);
    expect(view.getUint32(0, true)).toBe(128);
  });

  it("encodes CLOSE with a one-byte reason", () => {
    const frame = encodeClose(9, CloseReason.NETWORK_ERROR);
    const parsed = parseFrame(frame);
    expect(parsed.type).toBe(Packet.CLOSE);
    expect(parsed.streamId).toBe(9);
    expect(parsed.payload[0]).toBe(CloseReason.NETWORK_ERROR);
  });

  it("round-trips CONNECT (type, port, hostname)", () => {
    const frame = encodeConnect(42, {
      streamType: StreamType.TCP,
      port: 443,
      hostname: "example.com",
    });
    const parsed = parseFrame(frame);
    expect(parsed.type).toBe(Packet.CONNECT);
    expect(parsed.streamId).toBe(42);
    const info = parseConnect(parsed.payload);
    expect(info.streamType).toBe(StreamType.TCP);
    expect(info.port).toBe(443);
    expect(info.hostname).toBe("example.com");
  });

  it("rejects truncated frames and CONNECT payloads", () => {
    expect(() => parseFrame(new Uint8Array([1, 2, 3]))).toThrow();
    expect(() => parseConnect(new Uint8Array([1]))).toThrow();
  });
});
