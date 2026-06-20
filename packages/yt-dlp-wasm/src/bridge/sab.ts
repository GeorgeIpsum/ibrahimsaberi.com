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
  data.set(payload, 0); // ordered before the STATE-gate store below by agent program order
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
  // STATE is the visibility gate: callers reach here only after observing STATE
  // move off REQUEST (Atomics.wait), which establishes happens-before for the
  // LEN/data writes the responder made before its Atomics.notify. Load STATE first.
  const errored = Atomics.load(ctrl, SLOT.STATE) === STATE.ERROR;
  const len = Atomics.load(ctrl, SLOT.LEN);
  const out = data.slice(0, len);
  Atomics.store(ctrl, SLOT.STATE, STATE.IDLE);
  if (errored) throw new Error(decoder.decode(out));
  return out;
}

type Handler = (
  op: number,
  payload: Uint8Array,
) => Promise<Uint8Array> | Uint8Array;

/**
 * Requester side. MUST run on a worker thread (Atomics.wait is illegal on the
 * main thread). `wake` nudges the responder's event loop (e.g. port.postMessage)
 * so it can run async work while this thread parks on Atomics.wait.
 */
export class SabRequester {
  private readonly ctrl: Int32Array;
  constructor(
    private readonly sab: SharedArrayBuffer,
    private readonly wake: (reqId: number) => void,
  ) {
    this.ctrl = new Int32Array(sab, 0, CTRL_BYTES / 4);
  }

  call(op: number, payload: Uint8Array): Uint8Array {
    const reqId = writeRequest(this.sab, op, payload);
    this.wake(reqId);
    while (Atomics.load(this.ctrl, SLOT.STATE) === STATE.REQUEST) {
      Atomics.wait(this.ctrl, SLOT.STATE, STATE.REQUEST);
    }
    return readResponse(this.sab);
  }

  callText(op: number, text: string): string {
    return decoder.decode(this.call(op, encoder.encode(text)));
  }
}

/**
 * Responder side. Driven by the wake signal (NOT Atomics.wait) so its event loop
 * stays free for async work (libcurl, ffmpeg.wasm). Call `handle` from the wake
 * message handler in production; `handleSync` exists for synchronous handlers/tests.
 */
export class SabResponder {
  constructor(
    private readonly sab: SharedArrayBuffer,
    private readonly handler: Handler,
  ) {}

  async handle(): Promise<void> {
    const { op, payload } = readRequest(this.sab);
    try {
      writeResponse(this.sab, await this.handler(op, payload), false);
    } catch (err) {
      writeResponse(this.sab, encoder.encode(messageOf(err)), true);
    }
  }

  handleSync(): void {
    const { op, payload } = readRequest(this.sab);
    try {
      const resp = this.handler(op, payload);
      if (resp instanceof Promise) {
        throw new TypeError("handleSync requires a synchronous handler");
      }
      writeResponse(this.sab, resp, false);
    } catch (err) {
      writeResponse(this.sab, encoder.encode(messageOf(err)), true);
    }
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
