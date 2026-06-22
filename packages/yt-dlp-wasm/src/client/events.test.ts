import { describe, expect, it } from "vitest";
import { Emitter } from "./events";

describe("Emitter", () => {
  it("delivers to on() listeners and stops after off()", () => {
    const e = new Emitter<{ progress: number; log: string }>();
    const seen: number[] = [];
    const cb = (n: number) => seen.push(n);
    e.on("progress", cb);
    e.emit("progress", 1);
    e.off("progress", cb);
    e.emit("progress", 2);
    expect(seen).toEqual([1]);
  });

  it("isolates channels and tolerates a throwing listener", () => {
    const e = new Emitter<{ a: string; b: string }>();
    const got: string[] = [];
    e.on("a", () => {
      throw new Error("boom");
    });
    e.on("a", (v) => got.push(`a:${v}`));
    e.on("b", (v) => got.push(`b:${v}`));
    e.emit("a", "x");
    e.emit("b", "y");
    expect(got).toEqual(["a:x", "b:y"]);
  });
});
