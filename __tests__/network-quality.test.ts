import { describe, expect, it, vi } from "vitest";
import {
  clampInt,
  computeMbps,
  computeUploadMbps,
  INITIAL_STATUS_STATE,
  isSlowReading,
  measureDownload,
  measurePing,
  reduceStatus,
} from "../src/utils/network-quality";

describe("computeMbps", () => {
  it("converts bytes over a duration into megabits per second", () => {
    // 1,000,000 bytes in 1s = 8,000,000 bits/s = 8 Mbps
    expect(computeMbps(1_000_000, 1000)).toBe(8);
  });

  it("scales with the elapsed window", () => {
    // 512 KiB in 100ms
    expect(computeMbps(512 * 1024, 100)).toBeCloseTo(41.94304, 4);
  });

  it("returns 0 for a non-positive duration instead of Infinity", () => {
    expect(computeMbps(1000, 0)).toBe(0);
    expect(computeMbps(1000, -5)).toBe(0);
  });
});

describe("clampInt", () => {
  const MIN = 1024;
  const MAX = 67_108_864;
  const FALLBACK = 3_145_728;

  it("returns a valid in-range integer untouched", () => {
    expect(clampInt("2048", MIN, MAX, FALLBACK)).toBe(2048);
  });

  it("clamps below the minimum", () => {
    expect(clampInt("10", MIN, MAX, FALLBACK)).toBe(MIN);
  });

  it("clamps above the maximum", () => {
    expect(clampInt("999999999999", MIN, MAX, FALLBACK)).toBe(MAX);
  });

  it("truncates fractional input", () => {
    expect(clampInt("2048.9", MIN, MAX, FALLBACK)).toBe(2048);
  });

  it("falls back for non-numeric input", () => {
    expect(clampInt("abc", MIN, MAX, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back for missing (null) input", () => {
    expect(clampInt(null, MIN, MAX, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back for an empty string", () => {
    expect(clampInt("", MIN, MAX, FALLBACK)).toBe(FALLBACK);
  });
});

// A fake stream reader whose clock advances as each chunk "arrives", so the
// measurement sees realistic per-chunk timing without real network/timers.
function fakeReader(
  chunks: Array<{ bytes: number; dtMs: number }>,
  clock: { t: number },
) {
  let i = 0;
  const reader = {
    canceled: false,
    read: async () => {
      if (i >= chunks.length) return { done: true, value: undefined };
      const chunk = chunks[i++];
      clock.t += chunk.dtMs;
      return { done: false, value: new Uint8Array(chunk.bytes) };
    },
    cancel: async () => {
      reader.canceled = true;
    },
  };
  return reader;
}

describe("measureDownload", () => {
  it("excludes the first chunk (TTFB + slow-start) from the measured interval", async () => {
    const clock = { t: 0 };
    const reader = fakeReader(
      [
        { bytes: 256 * 1024, dtMs: 100 }, // first chunk: starts the clock, not counted
        { bytes: 256 * 1024, dtMs: 50 },
        { bytes: 256 * 1024, dtMs: 50 },
      ],
      clock,
    );

    const mbps = await measureDownload({
      reader,
      windowMs: 10_000,
      maxBytes: 10_000_000,
      now: () => clock.t,
    });

    // 512 KiB counted over the 100ms interval after the first chunk arrived.
    expect(mbps).toBeCloseTo(computeMbps(512 * 1024, 100), 4);
    expect(reader.canceled).toBe(false); // stream ended naturally
  });

  it("stops and cancels the reader when the time window elapses", async () => {
    const clock = { t: 0 };
    const reader = fakeReader(
      [
        { bytes: 256 * 1024, dtMs: 10 },
        { bytes: 256 * 1024, dtMs: 10 },
        { bytes: 256 * 1024, dtMs: 900 }, // pushes elapsed past the window
        { bytes: 256 * 1024, dtMs: 10 }, // never read
      ],
      clock,
    );

    const mbps = await measureDownload({
      reader,
      windowMs: 800,
      maxBytes: 10_000_000,
      now: () => clock.t,
    });

    expect(reader.canceled).toBe(true);
    // counted bytes = chunk2 + chunk3 (512 KiB), interval = 910ms
    expect(mbps).toBeCloseTo(computeMbps(512 * 1024, 910), 4);
  });

  it("stops and cancels the reader when the byte cap is reached", async () => {
    const clock = { t: 0 };
    const reader = fakeReader(
      [
        { bytes: 256 * 1024, dtMs: 5 },
        { bytes: 256 * 1024, dtMs: 5 },
        { bytes: 256 * 1024, dtMs: 5 }, // crosses the 400 KiB cap
        { bytes: 256 * 1024, dtMs: 5 },
      ],
      clock,
    );

    const mbps = await measureDownload({
      reader,
      windowMs: 10_000,
      maxBytes: 400 * 1024,
      now: () => clock.t,
    });

    expect(reader.canceled).toBe(true);
    expect(mbps).toBeCloseTo(computeMbps(512 * 1024, 10), 4);
  });

  it("falls back to whole-transfer timing when only one chunk arrives", async () => {
    const clock = { t: 0 };
    const reader = fakeReader([{ bytes: 100 * 1024, dtMs: 30 }], clock);

    const mbps = await measureDownload({
      reader,
      windowMs: 800,
      maxBytes: 3_145_728,
      now: () => clock.t,
    });

    // Single chunk: no measurable interval, so use bytes over total elapsed.
    expect(mbps).toBeCloseTo(computeMbps(100 * 1024, 30), 4);
  });
});

describe("isSlowReading", () => {
  const thresholds = { bandwidthThresholdMbps: 2, pingThresholdMs: 500 };

  it("treats Save-Data as slow regardless of good numbers", () => {
    expect(
      isSlowReading(
        { downlinkMbps: 100, pingMs: 20, saveData: true },
        thresholds,
      ),
    ).toBe(true);
  });

  it("flags bandwidth below the threshold", () => {
    expect(isSlowReading({ downlinkMbps: 1.5, pingMs: 20 }, thresholds)).toBe(
      true,
    );
  });

  it("flags ping above the threshold", () => {
    expect(isSlowReading({ downlinkMbps: 50, pingMs: 600 }, thresholds)).toBe(
      true,
    );
  });

  it("passes a fast, low-latency reading", () => {
    expect(isSlowReading({ downlinkMbps: 50, pingMs: 30 }, thresholds)).toBe(
      false,
    );
  });

  it("does not flag bandwidth when downlink is unknown (null)", () => {
    expect(isSlowReading({ downlinkMbps: null, pingMs: 30 }, thresholds)).toBe(
      false,
    );
  });

  it("does not flag ping when rtt is unknown (null)", () => {
    expect(isSlowReading({ downlinkMbps: 50, pingMs: null }, thresholds)).toBe(
      false,
    );
  });
});

describe("reduceStatus", () => {
  const FAIL_THRESHOLD = 2;

  it("reports the very first slow reading immediately (no warmup 'good')", () => {
    const next = reduceStatus(INITIAL_STATUS_STATE, true, FAIL_THRESHOLD);
    expect(next.status).toBe("slow");
  });

  it("reports the very first good reading immediately", () => {
    const next = reduceStatus(INITIAL_STATUS_STATE, false, FAIL_THRESHOLD);
    expect(next.status).toBe("good");
  });

  it("debounces a transient slow reading after a good streak", () => {
    const good = reduceStatus(INITIAL_STATUS_STATE, false, FAIL_THRESHOLD);
    const oneSlow = reduceStatus(good, true, FAIL_THRESHOLD);
    expect(oneSlow.status).toBe("good"); // one blip does not flip it

    const twoSlow = reduceStatus(oneSlow, true, FAIL_THRESHOLD);
    expect(twoSlow.status).toBe("slow"); // sustained slowness does
  });

  it("recovers immediately on a good reading", () => {
    const good = reduceStatus(INITIAL_STATUS_STATE, false, FAIL_THRESHOLD);
    const slow = reduceStatus(
      reduceStatus(good, true, FAIL_THRESHOLD),
      true,
      FAIL_THRESHOLD,
    );
    expect(slow.status).toBe("slow");

    const recovered = reduceStatus(slow, false, FAIL_THRESHOLD);
    expect(recovered.status).toBe("good");
  });
});

describe("measurePing", () => {
  it("returns the minimum round-trip across samples", async () => {
    // now() called as: sample0 start/end, sample1 start/end, ...
    const times = [0, 40, 100, 120, 200, 230]; // durations: 40, 20, 30
    let i = 0;
    const now = () => times[i++];
    const fetchFn = vi.fn(async () => ({ ok: true }));

    const ping = await measurePing({
      fetchFn,
      url: "/api/net/ping",
      samples: 3,
      now,
    });

    expect(ping).toBe(20);
    // 1 warmup + 3 samples
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it("throws when a ping response is not ok", async () => {
    const fetchFn = vi.fn(async () => ({ ok: false }));
    await expect(
      measurePing({ fetchFn, url: "/api/net/ping", samples: 3, now: () => 0 }),
    ).rejects.toThrow();
  });
});

describe("computeUploadMbps", () => {
  it("measures over the first-to-last-sample interval, excluding the first sample's bytes", () => {
    // First sample (500 KB, buffered "instantly") is the baseline; the
    // measured interval carries 1,000,000 bytes over 1s = 8 Mbps.
    const mbps = computeUploadMbps({
      samples: [
        { loaded: 500_000, at: 100 },
        { loaded: 1_000_000, at: 600 },
        { loaded: 1_500_000, at: 1100 },
      ],
      totalBytes: 1_500_000,
      startMs: 0,
      endMs: 1200,
    });
    expect(mbps).toBe(8);
  });

  it("falls back to whole-transfer timing with fewer than two samples", () => {
    const mbps = computeUploadMbps({
      samples: [{ loaded: 1_000_000, at: 500 }],
      totalBytes: 1_000_000,
      startMs: 0,
      endMs: 1000,
    });
    expect(mbps).toBe(8);
  });

  it("falls back when the sample interval carries no bytes or time", () => {
    const sameInstant = computeUploadMbps({
      samples: [
        { loaded: 1_000_000, at: 500 },
        { loaded: 1_000_000, at: 500 },
      ],
      totalBytes: 1_000_000,
      startMs: 0,
      endMs: 1000,
    });
    expect(sameInstant).toBe(8);
  });
});
