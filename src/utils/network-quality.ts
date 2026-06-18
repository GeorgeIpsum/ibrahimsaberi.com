// Pure helpers shared by the /api/net routes (server) and the
// use-network-quality hook (client). No node/web-only imports so it stays
// importable from both and from unit tests.

/** Download payload byte cap (`?bytes=`) bounds. */
export const DEFAULT_DOWNLOAD_BYTES = 3 * 1024 * 1024; // 3 MB
export const MIN_DOWNLOAD_BYTES = 1024; // 1 KB
export const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024; // 64 MB

/** Server-side stream duration (`?ms=`) bounds. */
export const DEFAULT_DOWNLOAD_MS = 2000;
export const MIN_DOWNLOAD_MS = 50;
export const MAX_DOWNLOAD_MS = 30_000;

export type NetworkStatus = "checking" | "good" | "slow" | "offline";

export interface NetworkQuality {
  status: NetworkStatus;
  /** Effective downlink throughput in Mbps (a conservative lower bound on a
   * short sample, not link capacity), or null while unknown/offline. */
  downlinkMbps: number | null;
  /** Round-trip latency in ms, or null while unknown/offline. */
  pingMs: number | null;
}

export interface NetworkThresholds {
  bandwidthThresholdMbps: number;
  pingThresholdMs: number;
}

/** Throughput in megabits/sec; guards a non-positive interval. */
export const computeMbps = (bytes: number, ms: number): number => {
  if (ms <= 0) return 0;
  return (bytes * 8) / (ms / 1000) / 1_000_000;
};

interface Reading {
  downlinkMbps: number | null;
  pingMs: number | null;
  saveData?: boolean;
}

/**
 * Classify a single measurement as slow. Bandwidth is the primary signal; ping
 * is a lenient secondary one (it largely reflects distance to the server
 * region). An explicit Save-Data preference always counts as slow. Unknown
 * (null) metrics never trigger a flag on their own.
 */
export const isSlowReading = (
  { downlinkMbps, pingMs, saveData }: Reading,
  { bandwidthThresholdMbps, pingThresholdMs }: NetworkThresholds,
): boolean => {
  if (saveData) return true;
  if (downlinkMbps !== null && downlinkMbps < bandwidthThresholdMbps) {
    return true;
  }
  if (pingMs !== null && pingMs > pingThresholdMs) return true;
  return false;
};

export interface StatusState {
  status: NetworkStatus;
  failCount: number;
  initialized: boolean;
}

export const INITIAL_STATUS_STATE: StatusState = {
  status: "checking",
  failCount: 0,
  initialized: false,
};

/**
 * Fold a slow/not-slow reading into the status state machine. The first
 * completed reading takes effect immediately (no warmup "good"); afterwards a
 * slow reading must persist for `failThreshold` consecutive checks to flip the
 * status, while a single good reading recovers immediately.
 */
export const reduceStatus = (
  prev: StatusState,
  isSlow: boolean,
  failThreshold: number,
): StatusState => {
  if (!prev.initialized) {
    return {
      status: isSlow ? "slow" : "good",
      failCount: isSlow ? failThreshold : 0,
      initialized: true,
    };
  }

  const failCount = isSlow ? prev.failCount + 1 : 0;
  return {
    status: failCount >= failThreshold ? "slow" : "good",
    failCount,
    initialized: true,
  };
};

/** Round a Mbps reading to 1 decimal so display noise doesn't churn selectors. */
export const roundDownlink = (mbps: number): number =>
  Math.round(mbps * 10) / 10;

/** Round latency to whole milliseconds. */
export const roundPing = (ms: number): number => Math.round(ms);

/**
 * Parse a query-param integer, falling back when missing/non-numeric and
 * clamping into `[min, max]`. Keeps the download route from being coerced into
 * generating absurd payloads.
 */
export const clampInt = (
  raw: string | null,
  min: number,
  max: number,
  fallback: number,
): number => {
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

interface ChunkReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel(): Promise<void> | void;
}

interface MeasureDownloadOptions {
  reader: ChunkReader;
  windowMs: number;
  maxBytes: number;
  now?: () => number;
}

/**
 * Time-boxed throughput measurement over a byte stream. Reads until `windowMs`
 * elapses or `maxBytes` is received, whichever comes first, then cancels.
 *
 * The clock starts at the first chunk (excludes TTFB) and the first chunk's
 * bytes are not counted, so the measured interval is first-byte-to-last-byte —
 * which also sheds part of the TCP slow-start ramp. A single-chunk stream has
 * no such interval, so it falls back to whole-transfer timing.
 */
export const measureDownload = async ({
  reader,
  windowMs,
  maxBytes,
  now = () => performance.now(),
}: MeasureDownloadOptions): Promise<number> => {
  const fetchStart = now();
  let measuring = false;
  let start = 0;
  let bytes = 0;
  let firstChunkBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const len = value?.length ?? 0;

    if (!measuring) {
      measuring = true;
      start = now();
      firstChunkBytes = len;
      continue;
    }

    bytes += len;
    const elapsed = now() - start;
    if (elapsed >= windowMs || bytes >= maxBytes) {
      await reader.cancel();
      return computeMbps(bytes, elapsed);
    }
  }

  if (bytes > 0) return computeMbps(bytes, now() - start);
  // Degenerate (single chunk / tiny cap): no first-byte-to-last-byte interval.
  return computeMbps(firstChunkBytes, now() - fetchStart);
};

interface MeasurePingOptions {
  fetchFn: (
    url: string,
    init: { cache: "no-store"; signal?: AbortSignal },
  ) => Promise<{ ok: boolean }>;
  url: string;
  samples: number;
  signal?: AbortSignal;
  now?: () => number;
}

/**
 * Round-trip latency in ms. One warmup request establishes the connection (not
 * timed), then `samples` timed requests; returns the minimum to reject jitter.
 */
export const measurePing = async ({
  fetchFn,
  url,
  samples,
  signal,
  now = () => performance.now(),
}: MeasurePingOptions): Promise<number> => {
  const warmup = await fetchFn(url, { cache: "no-store", signal });
  if (!warmup.ok) throw new Error("ping failed");

  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < samples; i++) {
    const start = now();
    const res = await fetchFn(url, { cache: "no-store", signal });
    if (!res.ok) throw new Error("ping failed");
    best = Math.min(best, now() - start);
  }
  return best;
};
