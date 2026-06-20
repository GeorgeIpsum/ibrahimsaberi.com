import { describe, expect, it } from "vitest";
import { decodeFrame, encodeFrame } from "./frame";

describe("frame codec", () => {
  it("round-trips meta + body", () => {
    const body = new Uint8Array([1, 2, 3, 255]);
    const { meta, body: out } = decodeFrame(
      encodeFrame({ name: "a", offset: 5 }, body),
    );
    expect(meta).toEqual({ name: "a", offset: 5 });
    expect([...out]).toEqual([1, 2, 3, 255]);
  });

  it("handles empty body", () => {
    const { meta, body } = decodeFrame(encodeFrame({ ok: true }));
    expect(meta).toEqual({ ok: true });
    expect(body.length).toBe(0);
  });

  it("handles unicode meta", () => {
    const { meta } = decodeFrame(encodeFrame({ name: "café/二.mp3" }));
    expect(meta).toEqual({ name: "café/二.mp3" });
  });
});
