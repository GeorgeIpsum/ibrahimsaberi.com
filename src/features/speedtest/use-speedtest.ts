"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeMbps,
  computeUploadMbps,
  MAX_DOWNLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  measureDownload,
  measurePing,
  roundDownlink,
  roundPing,
  type UploadSample,
} from "@/utils/network-quality";
import type { SpeedtestResult } from "./codec";
import { formatUserLocation, parseVercelPop } from "./vercel-region";

// One-shot, user-initiated measurement. Deliberately heavier than the ambient
// use-network-quality loop: longer windows, more samples, plus an upload leg.

const PING_URL = "/api/net/ping";
const DOWN_URL = "/api/net/down";
const UP_URL = "/api/net/up";

const PING_SAMPLES = 5;

/** The whole test never finishes faster than this. Links too fast to fill it
 * with bytes spend the leftover in a latency-refinement phase. */
const MIN_TOTAL_MS = 10_000;

// Both throughput legs run staggered sequential passes until they've filled a
// wall-clock minimum — a single request is bounded by the server's byte cap,
// so on a fast link it ends in well under a second and yields one blip of a
// sample. Repetition elongates the test and every pass sheds its own
// TTFB/slow-start, so the best pass ≈ best sustained sample. MAX_PASSES also
// bounds worst-case egress per test (passes × 64 MB); tune to taste.
const DOWN_MIN_MS = 4000;
const DOWN_MAX_PASSES = 12;
const DOWN_PASS_WINDOW_MS = 2500;
// First pass runs a modest cap to estimate the link; later passes size their
// caps to fill a whole window at the observed rate (differing params/pass).
const DOWN_FIRST_PASS_BYTES = 16 * 1024 * 1024;
const DOWN_PASS_HEADROOM = 1.25;

// Upload passes are each bounded by Vercel's 4.5 MB request body limit, so
// elongation comes from repetition. Payloads adapt like download caps do: a
// small first probe, then sized to ~UPLOAD_PASS_TARGET_MS at the observed
// rate — a fixed multi-MB payload would blow way past the leg minimum on a
// slow uplink (3 MB at 1.5 Mbps is 16 s on its own).
const UPLOAD_MIN_MS = 4000;
const UPLOAD_MAX_PASSES = 24;
const UPLOAD_PASS_TARGET_MS = 2000;
const UPLOAD_FIRST_PASS_BYTES = 256 * 1024;
const UPLOAD_HEADROOM = 1.15;

/** Overall-progress weights per phase; must sum to 1. */
const PING_WEIGHT = 0.1;
const DOWN_WEIGHT = 0.4;
const UP_WEIGHT = 0.4;
const SETTLE_WEIGHT = 0.1;

/** Minimum ms between live-readout state updates (chunks can arrive far
 * faster than paints are useful). */
const LIVE_UPDATE_MS = 100;

export type SpeedtestPhase =
  | "idle"
  | "ping"
  | "down"
  | "up"
  | "settle"
  | "error";

export interface SpeedtestState {
  phase: SpeedtestPhase;
  /** Overall test progress in [0, 1]. */
  progress: number;
  /** Instantaneous throughput of the leg in flight, for the live readout. */
  liveMbps: number | null;
  pingMs: number | null;
  downMbps: number | null;
  upMbps: number | null;
  /** Edge POP code serving the test, once known (null locally). */
  region: string | null;
  /** Requester's geo-IP label, once known (null locally). */
  location: string | null;
}

const INITIAL_STATE: SpeedtestState = {
  phase: "idle",
  progress: 0,
  liveMbps: null,
  pingMs: null,
  downMbps: null,
  upMbps: null,
  region: null,
  location: null,
};

interface EdgeMeta {
  region: string | null;
  location: string | null;
}

/** Best-effort: POP + geo are display metadata, never a reason to fail a
 * test. Both ride on one ping response — the POP from the platform-stamped
 * x-vercel-id, the geo from the route's x-net-* echoes. */
const fetchEdgeMeta = async (signal: AbortSignal): Promise<EdgeMeta> => {
  try {
    const res = await fetch(PING_URL, { cache: "no-store", signal });
    return {
      region: parseVercelPop(res.headers.get("x-vercel-id")),
      location: formatUserLocation({
        city: res.headers.get("x-net-ip-city"),
        region: res.headers.get("x-net-ip-country-region"),
        country: res.headers.get("x-net-ip-country"),
      }),
    };
  } catch {
    return { region: null, location: null };
  }
};

const createUploadPayload = (bytes: number): Blob => {
  // 64 KB is the Web Crypto per-call cap; repeat one random chunk. Browsers
  // don't compress request bodies, so repetition can't inflate the reading.
  const chunk = new Uint8Array(64 * 1024);
  crypto.getRandomValues(chunk);
  const parts: BlobPart[] = [];
  for (let remaining = bytes; remaining > 0; remaining -= chunk.length) {
    parts.push(
      remaining >= chunk.length ? chunk : chunk.subarray(0, remaining),
    );
  }
  return new Blob(parts, { type: "application/octet-stream" });
};

const measureDownloadPass = async (
  signal: AbortSignal,
  capBytes: number,
  windowMs: number,
  onProgress: (bytes: number, elapsedMs: number) => void,
): Promise<number> => {
  // Server `ms` sits above the client window so the client always governs.
  const query = `?bytes=${capBytes}&ms=${windowMs + 1000}`;
  const response = await fetch(`${DOWN_URL}${query}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok || !response.body) throw new Error("download failed");

  return measureDownload({
    reader: response.body.getReader(),
    windowMs,
    maxBytes: capBytes,
    onProgress,
  });
};

/**
 * One upload pass over XHR — fetch has no upload-progress events. Resolves
 * with the pass's Mbps once the server acks.
 */
const measureUploadPass = (
  payload: Blob,
  signal: AbortSignal,
  onProgress: (liveMbps: number, sentFraction: number) => void,
): Promise<number> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const samples: UploadSample[] = [];
    const startMs = performance.now();
    let uploadEndMs = startMs;

    const onAbort = () => xhr.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    const settle = () => signal.removeEventListener("abort", onAbort);

    xhr.open("POST", UP_URL);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      const now = performance.now();
      samples.push({ loaded: e.loaded, at: now });
      onProgress(
        computeUploadMbps({
          samples,
          totalBytes: e.loaded,
          startMs,
          endMs: now,
        }),
        e.lengthComputable && e.total > 0 ? e.loaded / e.total : 0,
      );
    };
    // Timing ends when the last byte leaves, not when the response arrives —
    // waiting on the ack would fold an extra round trip into the reading.
    xhr.upload.onloadend = () => {
      uploadEndMs = performance.now();
    };
    xhr.onload = () => {
      settle();
      if (xhr.status >= 400) {
        reject(new Error(`upload failed (${xhr.status})`));
        return;
      }
      resolve(
        computeUploadMbps({
          samples,
          totalBytes: payload.size,
          startMs,
          endMs: uploadEndMs,
        }),
      );
    };
    xhr.onerror = () => {
      settle();
      reject(new Error("upload failed"));
    };
    xhr.onabort = () => {
      settle();
      reject(new DOMException("aborted", "AbortError"));
    };
    xhr.send(payload);
  });

export interface UseSpeedtestOptions {
  onComplete?: (result: SpeedtestResult) => void;
}

export const useSpeedtest = ({ onComplete }: UseSpeedtestOptions = {}) => {
  const [state, setState] = useState<SpeedtestState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const lastLiveAtRef = useRef(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => () => controllerRef.current?.abort(), []);

  const setLive = useCallback((patch: Partial<SpeedtestState>) => {
    const now = performance.now();
    if (now - lastLiveAtRef.current < LIVE_UPDATE_MS) return;
    lastLiveAtRef.current = now;
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const run = useCallback(
    async (signal: AbortSignal) => {
      const runStart = performance.now();
      setState({ ...INITIAL_STATE, phase: "ping" });

      // Doubles as the connection warmup; measurePing warms up again, which
      // just makes its first timed sample more stable.
      const { region, location } = await fetchEdgeMeta(signal);
      if (signal.aborted) return;
      setState((prev) => ({ ...prev, region, location }));

      const pingMs = roundPing(
        await measurePing({
          fetchFn: (url, init) => fetch(url, init),
          url: PING_URL,
          samples: PING_SAMPLES,
          signal,
        }),
      );
      if (signal.aborted) return;
      setState((prev) => ({
        ...prev,
        phase: "down",
        pingMs,
        progress: PING_WEIGHT,
      }));

      const downStart = performance.now();
      let bestDownMbps = 0;
      let downCapBytes = DOWN_FIRST_PASS_BYTES;
      for (let pass = 0; pass < DOWN_MAX_PASSES; pass++) {
        const remainingMs = DOWN_MIN_MS - (performance.now() - downStart);
        if (remainingMs <= 0) break;
        const windowMs = Math.min(DOWN_PASS_WINDOW_MS, remainingMs);

        const passMbps = await measureDownloadPass(
          signal,
          downCapBytes,
          windowMs,
          (bytes, elapsedMs) => {
            // Wall clock paces the leg; the pass counter floors progress so
            // fast links (which exit by pass count, not time) still advance.
            const fraction = Math.max(
              (performance.now() - downStart) / DOWN_MIN_MS,
              pass / DOWN_MAX_PASSES,
            );
            setLive({
              liveMbps:
                elapsedMs > 0
                  ? roundDownlink(computeMbps(bytes, elapsedMs))
                  : null,
              progress: PING_WEIGHT + DOWN_WEIGHT * Math.min(1, fraction),
            });
          },
        );
        if (signal.aborted) return;
        bestDownMbps = Math.max(bestDownMbps, passMbps);

        // Differing params per pass: size the next cap to fill a full window
        // at the observed rate, bounded by the route's absolute cap.
        const idealBytes = Math.round(
          ((passMbps * 1_000_000) / 8) *
            (DOWN_PASS_WINDOW_MS / 1000) *
            DOWN_PASS_HEADROOM,
        );
        downCapBytes = Math.min(
          MAX_DOWNLOAD_BYTES,
          Math.max(DOWN_FIRST_PASS_BYTES, idealBytes),
        );
      }
      const downMbps = roundDownlink(bestDownMbps);
      setState((prev) => ({
        ...prev,
        phase: "up",
        downMbps,
        liveMbps: null,
        progress: PING_WEIGHT + DOWN_WEIGHT,
      }));

      let bestUpMbps = 0;
      let uploadPayloadBytes = UPLOAD_FIRST_PASS_BYTES;
      const uploadStart = performance.now();
      for (let pass = 0; pass < UPLOAD_MAX_PASSES; pass++) {
        if (performance.now() - uploadStart >= UPLOAD_MIN_MS) break;

        const passMbps = await measureUploadPass(
          createUploadPayload(uploadPayloadBytes),
          signal,
          (liveMbps) => {
            const fraction = Math.max(
              (performance.now() - uploadStart) / UPLOAD_MIN_MS,
              pass / UPLOAD_MAX_PASSES,
            );
            setLive({
              liveMbps: roundDownlink(liveMbps),
              progress:
                PING_WEIGHT + DOWN_WEIGHT + UP_WEIGHT * Math.min(1, fraction),
            });
          },
        );
        if (signal.aborted) return;
        bestUpMbps = Math.max(bestUpMbps, passMbps);

        // Differing params per pass, same idea as download: size the next
        // payload to ~UPLOAD_PASS_TARGET_MS at the observed rate.
        const idealBytes = Math.round(
          ((passMbps * 1_000_000) / 8) *
            (UPLOAD_PASS_TARGET_MS / 1000) *
            UPLOAD_HEADROOM,
        );
        uploadPayloadBytes = Math.min(
          MAX_UPLOAD_BYTES,
          Math.max(UPLOAD_FIRST_PASS_BYTES, idealBytes),
        );
      }
      const upMbps = roundDownlink(bestUpMbps);

      // Latency-refinement pad: keep the test honest about its minimum
      // duration by spending any leftover wall time on extra ping samples
      // (which can only improve the reported minimum RTT).
      let settledPingMs = pingMs;
      setState((prev) => ({
        ...prev,
        phase: "settle",
        upMbps,
        liveMbps: null,
        pingMs: settledPingMs,
        progress: PING_WEIGHT + DOWN_WEIGHT + UP_WEIGHT,
      }));
      const settleStart = performance.now();
      const deadline = runStart + MIN_TOTAL_MS;
      try {
        while (performance.now() < deadline) {
          if (signal.aborted) return;
          const sampleStart = performance.now();
          const res = await fetch(PING_URL, { cache: "no-store", signal });
          if (!res.ok) break;
          settledPingMs = Math.min(
            settledPingMs,
            roundPing(performance.now() - sampleStart),
          );
          const fraction = Math.min(
            1,
            (performance.now() - settleStart) / (deadline - settleStart),
          );
          setLive({
            pingMs: settledPingMs,
            progress:
              PING_WEIGHT + DOWN_WEIGHT + UP_WEIGHT + SETTLE_WEIGHT * fraction,
          });
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } catch {
        // Best-effort refinement: the legs already produced a full result.
        if (signal.aborted) return;
      }

      setState((prev) => ({
        ...prev,
        phase: "idle",
        pingMs: settledPingMs,
        liveMbps: null,
        progress: 1,
      }));
      onCompleteRef.current?.({
        downMbps,
        upMbps,
        pingMs: settledPingMs,
        measuredAt: Date.now(),
        region,
        location,
      });
    },
    [setLive],
  );

  const start = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    run(controller.signal).catch(() => {
      if (controller.signal.aborted) return;
      setState((prev) => ({ ...prev, phase: "error", liveMbps: null }));
    });
  }, [run]);

  return { state, start };
};
