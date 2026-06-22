// Length-prefixed bridge frame: [uint32 LE metaLen][meta JSON utf8][raw body].
const enc = new TextEncoder();
const dec = new TextDecoder();

export function encodeFrame(
  meta: unknown,
  body: Uint8Array = new Uint8Array(0),
): Uint8Array {
  const metaBytes = enc.encode(JSON.stringify(meta));
  const out = new Uint8Array(4 + metaBytes.length + body.length);
  new DataView(out.buffer).setUint32(0, metaBytes.length, true);
  out.set(metaBytes, 4);
  out.set(body, 4 + metaBytes.length);
  return out;
}

export interface DecodedFrame<M = Record<string, unknown>> {
  meta: M;
  body: Uint8Array;
}

export function decodeFrame<M = Record<string, unknown>>(
  frame: Uint8Array,
): DecodedFrame<M> {
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  const metaLen = view.getUint32(0, true);
  const meta = JSON.parse(dec.decode(frame.subarray(4, 4 + metaLen))) as M;
  // Copy the body so it is detached from any SAB-backed source.
  return { meta, body: frame.slice(4 + metaLen) };
}
