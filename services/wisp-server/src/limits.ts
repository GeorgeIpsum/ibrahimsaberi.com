// Portable connection accounting: global + per-IP concurrency caps and a
// per-IP sliding-window connect rate limit. Time is injected (pass `now`) so
// it is deterministic under test and free of runtime globals.

export interface LimiterOptions {
  maxTotal: number;
  maxPerIp: number;
  ratePerMin: number;
}

export type AdmitResult =
  | { ok: true }
  | { ok: false; reason: "global" | "per-ip" | "rate" };

export class ConnectionLimiter {
  private readonly perIp = new Map<string, number>();
  private readonly recent = new Map<string, number[]>();
  private count = 0;

  constructor(private readonly opts: LimiterOptions) {}

  get total(): number {
    return this.count;
  }

  tryAdmit(ip: string, now: number): AdmitResult {
    if (this.count >= this.opts.maxTotal) return { ok: false, reason: "global" };
    if ((this.perIp.get(ip) ?? 0) >= this.opts.maxPerIp) {
      return { ok: false, reason: "per-ip" };
    }
    const windowStart = now - 60_000;
    const stamps = (this.recent.get(ip) ?? []).filter((t) => t > windowStart);
    if (stamps.length >= this.opts.ratePerMin) {
      return { ok: false, reason: "rate" };
    }

    stamps.push(now);
    this.recent.set(ip, stamps);
    this.perIp.set(ip, (this.perIp.get(ip) ?? 0) + 1);
    this.count += 1;
    return { ok: true };
  }

  release(ip: string): void {
    const n = this.perIp.get(ip) ?? 0;
    if (n <= 1) this.perIp.delete(ip);
    else this.perIp.set(ip, n - 1);
    if (this.count > 0) this.count -= 1;
  }
}
