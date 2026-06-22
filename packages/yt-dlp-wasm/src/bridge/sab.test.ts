import { describe, expect, it } from "vitest";
import { CTRL_SLOTS, OP, SLOT, STATE } from "../client/protocol";
import {
  createSab,
  readRequest,
  readResponse,
  SabRequester,
  SabResponder,
  writeRequest,
  writeResponse,
} from "./sab";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const stateOf = (sab: SharedArrayBuffer) =>
  Atomics.load(new Int32Array(sab, 0, CTRL_SLOTS), SLOT.STATE);

describe("sab frames", () => {
  it("writes then reads a request frame", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, enc("hello"));
    const req = readRequest(sab);
    expect(req.op).toBe(OP.ECHO);
    expect(dec(req.payload)).toBe("hello");
    expect(stateOf(sab)).toBe(STATE.REQUEST);
  });

  it("round-trips a response and returns to IDLE", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, new Uint8Array([1, 2, 3]));
    readRequest(sab);
    writeResponse(sab, enc("HELLO"), false);
    expect(dec(readResponse(sab))).toBe("HELLO");
    expect(stateOf(sab)).toBe(STATE.IDLE);
  });

  it("surfaces an error frame as a throw", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, new Uint8Array());
    readRequest(sab);
    writeResponse(sab, enc("boom"), true);
    expect(() => readResponse(sab)).toThrow("boom");
  });

  it("rejects a payload larger than capacity", () => {
    const sab = createSab(4);
    expect(() => writeRequest(sab, OP.ECHO, new Uint8Array(5))).toThrow(
      /exceeds capacity/,
    );
  });

  it("readRequest returns a copy isolated from the SAB", () => {
    const sab = createSab(8);
    writeRequest(sab, OP.ECHO, new Uint8Array([1, 2, 3]));
    const { payload } = readRequest(sab);
    payload[0] = 0xff;
    writeRequest(sab, OP.ECHO, new Uint8Array([9, 9, 9])); // overwrite data region
    expect(payload[0]).toBe(0xff); // still 0xff — truly detached
  });
});

describe("SabRequester / SabResponder", () => {
  it("call() returns a synchronously-produced response", () => {
    const sab = createSab(1024);
    // Responder transforms bytes by +1; wake runs it inline (instantaneous).
    const responder = new SabResponder(sab, (_op, payload) =>
      Uint8Array.from(payload, (b) => b + 1),
    );
    const requester = new SabRequester(sab, () => responder.handleSync());
    const out = requester.call(OP.ECHO, new Uint8Array([1, 2, 3]));
    expect(Array.from(out)).toEqual([2, 3, 4]);
  });

  it("callText() encodes/decodes UTF-8", () => {
    const sab = createSab(1024);
    const responder = new SabResponder(sab, (_op, payload) =>
      Uint8Array.from(payload, (b) => (b >= 97 && b <= 122 ? b - 32 : b)),
    );
    const requester = new SabRequester(sab, () => responder.handleSync());
    expect(requester.callText(OP.ECHO, "hello")).toBe("HELLO");
  });

  it("call() throws when the handler throws", () => {
    const sab = createSab(1024);
    const responder = new SabResponder(sab, () => {
      throw new Error("nope");
    });
    const requester = new SabRequester(sab, () => responder.handleSync());
    expect(() => requester.callText(OP.ECHO, "x")).toThrow("nope");
  });

  it("clamps an oversized error message instead of deadlocking", () => {
    const sab = createSab(8); // tiny data region
    const responder = new SabResponder(sab, () => {
      throw new Error("x".repeat(100));
    });
    const requester = new SabRequester(sab, () => responder.handleSync());
    // Should THROW a (truncated) error, NOT hang.
    expect(() => requester.callText(OP.ECHO, "a")).toThrow();
  });

  it("downgrades an oversized success payload to an error frame", () => {
    // SAB must be large enough to hold the RangeError message (~32 chars) but
    // smaller than the handler's 100-byte return value to trigger the overflow path.
    const sab = createSab(64);
    const responder = new SabResponder(sab, () => new Uint8Array(100));
    const requester = new SabRequester(sab, () => responder.handleSync());
    expect(() => requester.call(OP.ECHO, new Uint8Array([1]))).toThrow(
      /exceeds capacity/,
    );
  });
});
