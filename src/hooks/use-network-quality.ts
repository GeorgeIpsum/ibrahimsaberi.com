import { useCallback, useRef, useSyncExternalStore } from "react";
import {
  DEFAULT_DOWNLOAD_BYTES,
  INITIAL_STATUS_STATE,
  isSlowReading,
  measureDownload,
  measurePing,
  type NetworkQuality,
  reduceStatus,
  roundDownlink,
  roundPing,
  type StatusState,
} from "@/utils/network-quality";

export type { NetworkQuality, NetworkStatus } from "@/utils/network-quality";

export interface NetworkQualityConfig {
  pingUrl: string;
  downloadUrl: string;
  interval: number;
  pingThresholdMs: number;
  bandwidthThresholdMbps: number;
  failCountThreshold: number;
  pingSamples: number;
  downloadWindowMs: number;
  maxDownloadBytes: number;
  /** Prefer the free Network Information API (Chromium/Android) over an active
   * download when it's available, and honor Save-Data. */
  preferNetworkInformation: boolean;
  onError?: (error: unknown) => void;
}

const DEFAULT_CONFIG: NetworkQualityConfig = {
  pingUrl: "/api/net/ping",
  downloadUrl: "/api/net/down",
  interval: 10_000,
  pingThresholdMs: 500,
  bandwidthThresholdMbps: 2,
  failCountThreshold: 2,
  pingSamples: 3,
  downloadWindowMs: 800,
  maxDownloadBytes: DEFAULT_DOWNLOAD_BYTES,
  preferNetworkInformation: true,
};

let config: NetworkQualityConfig = { ...DEFAULT_CONFIG };

// ---------------------------------------------------------------------------
// Shared store: one ref-counted measurement loop backs every subscriber, so N
// consumers don't trigger N duplicate downloads. Selectors (below) keep each
// consumer from re-rendering unless its own slice of the snapshot changes.
// ---------------------------------------------------------------------------

const INITIAL_SNAPSHOT: NetworkQuality = {
  status: "checking",
  downlinkMbps: null,
  pingMs: null,
};

let snapshot: NetworkQuality = INITIAL_SNAPSHOT;
let statusState: StatusState = INITIAL_STATUS_STATE;

const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let controller: AbortController | null = null;

const getSnapshot = (): NetworkQuality => snapshot;
const getServerSnapshot = (): NetworkQuality => INITIAL_SNAPSHOT;

const setSnapshot = (next: NetworkQuality) => {
  snapshot = next;
  for (const listener of listeners) listener();
};

interface NetworkInformationLike {
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
}

const getConnection = (): NetworkInformationLike | undefined => {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
};

const measureDownloadSpeed = async (
  cfg: NetworkQualityConfig,
  signal: AbortSignal,
): Promise<number> => {
  // Server `ms` sits above the client window so the client always governs the
  // measurement; `bytes` is the real cap on fast links.
  const query = `?bytes=${cfg.maxDownloadBytes}&ms=${cfg.downloadWindowMs + 500}`;
  const response = await fetch(`${cfg.downloadUrl}${query}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok || !response.body) throw new Error("Download failed");

  const reader = response.body.getReader();
  return measureDownload({
    reader,
    windowMs: cfg.downloadWindowMs,
    maxBytes: cfg.maxDownloadBytes,
  });
};

const measure = async (signal: AbortSignal) => {
  const conn = config.preferNetworkInformation ? getConnection() : undefined;

  // Save-Data: respect it and skip the download entirely — testing a
  // data-saver user with a 3 MB transfer would defeat the purpose.
  if (conn?.saveData === true) {
    return {
      downlinkMbps: typeof conn.downlink === "number" ? conn.downlink : null,
      pingMs: typeof conn.rtt === "number" ? conn.rtt : null,
      saveData: true,
    };
  }

  // Network Information estimate available: free, zero bytes.
  if (conn && typeof conn.downlink === "number") {
    return {
      downlinkMbps: conn.downlink,
      pingMs: typeof conn.rtt === "number" ? conn.rtt : null,
      saveData: false,
    };
  }

  // Active measurement (Safari/Firefox, or API disabled): ping first (clean),
  // then saturate the link for the download.
  const pingMs = await measurePing({
    fetchFn: (url, init) => fetch(url, init),
    url: config.pingUrl,
    samples: config.pingSamples,
    signal,
  });
  const downlinkMbps = await measureDownloadSpeed(config, signal);
  return { downlinkMbps, pingMs, saveData: false };
};

const runCheck = async () => {
  controller?.abort();
  const ctrl = new AbortController();
  controller = ctrl;

  try {
    const reading = await measure(ctrl.signal);
    if (ctrl.signal.aborted) return;

    const slow = isSlowReading(reading, {
      bandwidthThresholdMbps: config.bandwidthThresholdMbps,
      pingThresholdMs: config.pingThresholdMs,
    });
    statusState = reduceStatus(statusState, slow, config.failCountThreshold);

    setSnapshot({
      status: statusState.status,
      downlinkMbps:
        reading.downlinkMbps === null
          ? null
          : roundDownlink(reading.downlinkMbps),
      pingMs: reading.pingMs === null ? null : roundPing(reading.pingMs),
    });
  } catch (err) {
    if (ctrl.signal.aborted) return; // superseded by a newer check; ignore
    config.onError?.(err);
    statusState = INITIAL_STATUS_STATE; // recover immediately once back online
    setSnapshot({ status: "offline", downlinkMbps: null, pingMs: null });
  }
};

const teardown = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  controller?.abort();
  controller = null;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", runCheck);
    window.removeEventListener("offline", runCheck);
    getConnection()?.removeEventListener?.("change", runCheck);
  }
};

const startLoop = () => {
  if (typeof window === "undefined" || intervalId !== null) return;
  runCheck();
  intervalId = setInterval(runCheck, config.interval);
  window.addEventListener("online", runCheck);
  window.addEventListener("offline", runCheck);
  getConnection()?.addEventListener?.("change", runCheck);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) startLoop();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      teardown();
      statusState = INITIAL_STATUS_STATE;
      snapshot = INITIAL_SNAPSHOT;
    }
  };
};

/** Override the shared measurement config. Restarts the loop if it's running. */
export const configureNetworkQuality = (
  partial: Partial<NetworkQualityConfig>,
) => {
  config = { ...config, ...partial };
  if (listeners.size > 0) {
    teardown();
    startLoop();
  }
};

/** Shallow object equality, for selectors that return a derived object. */
export const shallowEqual = <T extends Record<string, unknown>>(
  a: T,
  b: T,
): boolean => {
  if (Object.is(a, b)) return true;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
};

const identity = (q: NetworkQuality): NetworkQuality => q;

/**
 * Subscribe to shared network-quality measurements.
 *
 * - `useNetworkQuality()` → the whole `{ status, downlinkMbps, pingMs }`
 *   snapshot (re-renders every interval).
 * - `useNetworkQuality(q => q.status)` → just the status; the consumer
 *   re-renders only when the status tier actually changes.
 * - Selectors returning a derived object should pass `shallowEqual` to keep
 *   reference identity stable across ticks.
 */
export function useNetworkQuality(): NetworkQuality;
export function useNetworkQuality<T>(
  selector: (q: NetworkQuality) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useNetworkQuality<T>(
  selector: (q: NetworkQuality) => T = identity as unknown as (
    q: NetworkQuality,
  ) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  // Cache the last selection so getSelection returns a stable reference when
  // nothing relevant changed — required by useSyncExternalStore, and what
  // suppresses re-renders for unaffected selectors.
  const cacheRef = useRef<{ snap: NetworkQuality; value: T } | null>(null);

  const getSelection = useCallback((): T => {
    const snap = getSnapshot();
    const cache = cacheRef.current;
    if (cache && cache.snap === snap) return cache.value;

    const value = selectorRef.current(snap);
    if (cache && isEqualRef.current(cache.value, value)) {
      cacheRef.current = { snap, value: cache.value };
      return cache.value;
    }
    cacheRef.current = { snap, value };
    return value;
  }, []);

  const getServerSelection = useCallback(
    (): T => selectorRef.current(getServerSnapshot()),
    [],
  );

  return useSyncExternalStore(subscribe, getSelection, getServerSelection);
}
