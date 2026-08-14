import { describe, expect, it } from "vitest";
import { ConnectionLimiter } from "./limits";

const opts = { maxTotal: 3, maxPerIp: 2, ratePerMin: 5 };

describe("ConnectionLimiter", () => {
  it("admits under all caps", () => {
    const l = new ConnectionLimiter(opts);
    expect(l.tryAdmit("1.1.1.1", 0).ok).toBe(true);
    expect(l.total).toBe(1);
  });

  it("rejects over the per-IP cap", () => {
    const l = new ConnectionLimiter(opts);
    l.tryAdmit("a", 0);
    l.tryAdmit("a", 0);
    const r = l.tryAdmit("a", 0);
    expect(r).toEqual({ ok: false, reason: "per-ip" });
  });

  it("rejects over the global cap", () => {
    const l = new ConnectionLimiter(opts);
    l.tryAdmit("a", 0);
    l.tryAdmit("b", 0);
    l.tryAdmit("c", 0);
    expect(l.tryAdmit("d", 0)).toEqual({ ok: false, reason: "global" });
  });

  it("release frees a slot", () => {
    const l = new ConnectionLimiter(opts);
    l.tryAdmit("a", 0);
    l.tryAdmit("a", 0);
    l.release("a");
    expect(l.tryAdmit("a", 0).ok).toBe(true);
  });

  it("rate-limits new connections per IP within a minute", () => {
    const l = new ConnectionLimiter({
      maxTotal: 100,
      maxPerIp: 100,
      ratePerMin: 3,
    });
    for (let i = 0; i < 3; i++) {
      const r = l.tryAdmit("a", 1000 * i);
      expect(r.ok).toBe(true);
      l.release("a");
    }
    expect(l.tryAdmit("a", 3000)).toEqual({ ok: false, reason: "rate" });
  });

  it("rate window slides after 60s", () => {
    const l = new ConnectionLimiter({
      maxTotal: 100,
      maxPerIp: 100,
      ratePerMin: 1,
    });
    expect(l.tryAdmit("a", 0).ok).toBe(true);
    l.release("a");
    expect(l.tryAdmit("a", 100).ok).toBe(false);
    expect(l.tryAdmit("a", 60001).ok).toBe(true);
  });
});
