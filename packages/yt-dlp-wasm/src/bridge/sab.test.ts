import { describe, expect, it } from "vitest";
import { OP, SLOT, STATE } from "../client/protocol";
import {
  createSab,
  readRequest,
  readResponse,
  writeRequest,
  writeResponse,
} from "./sab";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const stateOf = (sab: SharedArrayBuffer) =>
  Atomics.load(new Int32Array(sab, 0, 4), SLOT.STATE);

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
});
