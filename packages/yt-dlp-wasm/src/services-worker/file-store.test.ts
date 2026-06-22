import { describe, expect, it } from "vitest";
import { FileStore } from "./file-store";

describe("FileStore", () => {
  it("puts at offsets and stats/gets", () => {
    const s = new FileStore();
    s.put("f", 0, new Uint8Array([1, 2, 3]));
    s.put("f", 3, new Uint8Array([4, 5]));
    expect(s.stat("f")).toBe(5);
    const { body, eof } = s.get("f", 0, 3);
    expect([...body]).toEqual([1, 2, 3]);
    expect(eof).toBe(false);
    const tail = s.get("f", 3, 100);
    expect([...tail.body]).toEqual([4, 5]);
    expect(tail.eof).toBe(true);
  });

  it("delete + has + set/raw", () => {
    const s = new FileStore();
    s.set("g", new Uint8Array([9]));
    expect(s.has("g")).toBe(true);
    expect([...(s.raw("g") ?? [])]).toEqual([9]);
    s.delete("g");
    expect(s.has("g")).toBe(false);
  });

  it("stat/get throw for missing files", () => {
    const s = new FileStore();
    expect(() => s.stat("nope")).toThrow(/no such file/);
  });
});
