import { CTRL_BYTES, SLOT, STATE } from "../client/protocol";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Allocate a SharedArrayBuffer: control region + `dataCapacity` payload bytes. */
export function createSab(dataCapacity: number): SharedArrayBuffer {
  return new SharedArrayBuffer(CTRL_BYTES + dataCapacity);
}

function views(sab: SharedArrayBuffer): { ctrl: Int32Array; data: Uint8Array } {
  return {
    ctrl: new Int32Array(sab, 0, CTRL_BYTES / 4),
    data: new Uint8Array(sab, CTRL_BYTES),
  };
}

/** Write a request frame (op + payload) and mark STATE=REQUEST. Returns the request id. */
export function writeRequest(
  sab: SharedArrayBuffer,
  op: number,
  payload: Uint8Array,
): number {
  const { ctrl, data } = views(sab);
  if (payload.byteLength > data.byteLength) {
    throw new RangeError(
      `payload ${payload.byteLength} exceeds capacity ${data.byteLength}`,
    );
  }
  data.set(payload, 0);
  const reqId = Atomics.add(ctrl, SLOT.REQ_ID, 1) + 1;
  Atomics.store(ctrl, SLOT.OP, op);
  Atomics.store(ctrl, SLOT.LEN, payload.byteLength);
  Atomics.store(ctrl, SLOT.STATE, STATE.REQUEST);
  return reqId;
}

/** Read the pending request frame (copies the payload out of the shared buffer). */
export function readRequest(sab: SharedArrayBuffer): {
  op: number;
  payload: Uint8Array;
} {
  const { ctrl, data } = views(sab);
  const op = Atomics.load(ctrl, SLOT.OP);
  const len = Atomics.load(ctrl, SLOT.LEN);
  return { op, payload: data.slice(0, len) };
}

/** Write a response (or error) frame and notify a parked requester. */
export function writeResponse(
  sab: SharedArrayBuffer,
  payload: Uint8Array,
  errored = false,
): void {
  const { ctrl, data } = views(sab);
  if (payload.byteLength > data.byteLength) {
    throw new RangeError(
      `response ${payload.byteLength} exceeds capacity ${data.byteLength}`,
    );
  }
  data.set(payload, 0);
  Atomics.store(ctrl, SLOT.LEN, payload.byteLength);
  Atomics.store(ctrl, SLOT.STATE, errored ? STATE.ERROR : STATE.RESPONSE);
  Atomics.notify(ctrl, SLOT.STATE);
}

/** Read the response frame and reset to IDLE; throws if it is an error frame. */
export function readResponse(sab: SharedArrayBuffer): Uint8Array {
  const { ctrl, data } = views(sab);
  const len = Atomics.load(ctrl, SLOT.LEN);
  const out = data.slice(0, len);
  const errored = Atomics.load(ctrl, SLOT.STATE) === STATE.ERROR;
  Atomics.store(ctrl, SLOT.STATE, STATE.IDLE);
  if (errored) throw new Error(decoder.decode(out));
  return out;
}

export { encoder as _encoder, decoder as _decoder };
