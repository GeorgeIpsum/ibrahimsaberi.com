import { describe, expect, it } from "vitest";
import {
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
} from "@/features/control-panel/color";

describe("color conversions", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("ffa85c")).toEqual({ r: 255, g: 168, b: 92 });
    expect(hexToRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("expands 3-digit shorthand hex", () => {
    expect(hexToRgb("f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it("strips non-hex chars and pads partial input", () => {
    expect(hexToRgb("#ff")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("serializes rgb to 6-digit lowercase hex", () => {
    expect(rgbToHex({ r: 255, g: 168, b: 92 })).toBe("ffa85c");
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("000000");
  });

  it("clamps and rounds out-of-range channels", () => {
    expect(rgbToHex({ r: 300, g: -5, b: 127.6 })).toBe("ff0080");
  });

  it("converts pure primaries rgb -> hsv", () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toMatchObject({
      h: 0,
      s: 1,
      v: 1,
    });
    expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toMatchObject({
      h: 120,
      s: 1,
      v: 1,
    });
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toMatchObject({
      h: 240,
      s: 1,
      v: 1,
    });
  });

  it("reports hue 0 / sat 0 for grays (no undefined hue)", () => {
    const hsv = rgbToHsv({ r: 128, g: 128, b: 128 });
    expect(hsv.h).toBe(0);
    expect(hsv.s).toBe(0);
    expect(hsv.v).toBeCloseTo(128 / 255);
  });

  it("round-trips hex -> rgb -> hsv -> rgb -> hex exactly", () => {
    for (const hex of [
      "ffa85c",
      "123456",
      "00ff00",
      "abcdef",
      "808080",
      "ffffff",
      "010203",
    ]) {
      expect(rgbToHex(hsvToRgb(rgbToHsv(hexToRgb(hex))))).toBe(hex);
    }
  });
});
