import { describe, expect, it } from "vitest";
import {
  decodeResult,
  encodeResult,
  type SpeedtestResult,
} from "../src/features/speedtest/codec";
import {
  formatUserLocation,
  parseVercelRegion,
} from "../src/features/speedtest/vercel-region";

const RESULT: SpeedtestResult = {
  downMbps: 234.5,
  upMbps: 12.3,
  pingMs: 23,
  measuredAt: 1_751_000_000_000,
  region: "fra1",
  location: "Toronto, ON, CA",
};

describe("speedtest result codec", () => {
  it("round-trips a result through the search param encoding", () => {
    expect(decodeResult(encodeResult(RESULT))).toEqual(RESULT);
  });

  it("round-trips a result with no region or location", () => {
    const result = { ...RESULT, region: null, location: null };
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("round-trips a non-ASCII location", () => {
    const result = { ...RESULT, location: "São Paulo, SP, BR" };
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("round-trips a location beyond Latin-1 (btoa would throw raw)", () => {
    const result = { ...RESULT, location: "東京, JP" };
    expect(decodeResult(encodeResult(result))).toEqual(result);
  });

  it("drops an implausible location instead of rejecting the result", () => {
    const forged = (l: unknown) =>
      btoa(JSON.stringify({ v: 1, d: 10, u: 10, p: 10, t: 10, l }));
    expect(decodeResult(forged("a".repeat(200)))?.location).toBeNull();
    expect(decodeResult(forged("bad\u0000value"))?.location).toBeNull();
    expect(decodeResult(forged(42))?.location).toBeNull();
  });

  it("produces URL-safe output (no +, /, or padding)", () => {
    expect(encodeResult(RESULT)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns null for a missing param", () => {
    expect(decodeResult(undefined)).toBeNull();
    expect(decodeResult("")).toBeNull();
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeResult("not-base64!!!")).toBeNull();
    expect(decodeResult(btoa("not json"))).toBeNull();
    expect(decodeResult(btoa('{"v":1}'))).toBeNull();
  });

  it("returns null for an unknown version", () => {
    const forged = btoa(JSON.stringify({ v: 2, d: 1, u: 1, p: 1, t: 1 }));
    expect(decodeResult(forged)).toBeNull();
  });

  it("returns null for implausible numbers", () => {
    const forged = (patch: Record<string, unknown>) =>
      btoa(JSON.stringify({ v: 1, d: 10, u: 10, p: 10, t: 10, ...patch }));
    expect(decodeResult(forged({ d: -5 }))).toBeNull();
    expect(decodeResult(forged({ u: Number.POSITIVE_INFINITY }))).toBeNull();
    expect(decodeResult(forged({ p: "fast" }))).toBeNull();
    expect(decodeResult(forged({ t: Number.NaN }))).toBeNull();
  });

  it("drops a malformed region instead of rejecting the result", () => {
    const forged = (r: string) =>
      btoa(JSON.stringify({ v: 1, d: 10, u: 10, p: 10, t: 10, r }));
    expect(decodeResult(forged("<script>"))?.region).toBeNull();
    // A bounded digit tail keeps a forged param from smuggling a huge string.
    expect(decodeResult(forged(`fra${"1".repeat(5000)}`))?.region).toBeNull();
  });
});

describe("formatUserLocation", () => {
  it("joins city, region, and country, decoding the RFC3986 city", () => {
    expect(
      formatUserLocation({
        city: "S%C3%A3o%20Paulo",
        region: "SP",
        country: "BR",
      }),
    ).toBe("São Paulo, SP, BR");
  });

  it("skips missing parts", () => {
    expect(
      formatUserLocation({ city: null, region: null, country: "CA" }),
    ).toBe("CA");
  });

  it("returns null when nothing is known", () => {
    expect(
      formatUserLocation({ city: null, region: null, country: null }),
    ).toBeNull();
  });

  it("falls back to the raw city when decoding fails", () => {
    expect(
      formatUserLocation({ city: "bad%2", region: null, country: "US" }),
    ).toBe("bad%2, US");
  });
});

describe("parseVercelRegion", () => {
  it("extracts the last region segment (the compute region) of x-vercel-id", () => {
    expect(parseVercelRegion("fra1::iad1::abc12-1234567890-xyz")).toBe("iad1");
    expect(parseVercelRegion("iad1::abc12-1234567890-xyz")).toBe("iad1");
  });

  it("normalizes case", () => {
    expect(parseVercelRegion("FRA1::abc")).toBe("fra1");
  });

  it("returns null for a missing header or no region-shaped segment", () => {
    expect(parseVercelRegion(null)).toBeNull();
    expect(parseVercelRegion("")).toBeNull();
    expect(parseVercelRegion("abc12-1234567890-xyz")).toBeNull();
  });
});
