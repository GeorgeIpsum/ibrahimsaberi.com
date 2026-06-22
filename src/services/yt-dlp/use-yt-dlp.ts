"use client";

import type { YtDlp, YtDlpConfig, YtDlpEvents } from "@local/yt-dlp-wasm";
import { useCallback, useRef, useState } from "react";
import { createYtDlpClient, isSupported } from "./client";

export type YtDlpStatus = "idle" | "loading" | "ready" | "error";

export interface DownloadResult {
  files: { name: string; size: number }[];
}

export interface UseYtDlp {
  status: YtDlpStatus;
  version: string | null;
  error: string | null;
  supported: boolean;
  /** Rolling log lines from the most recent operation (capped). */
  logs: string[];
  /** Latest progress event during a download. */
  progress: YtDlpEvents["progress"] | null;
  /** Boot the client (idempotent); resolves the controller or null on failure. */
  load: (overrides?: Partial<YtDlpConfig>) => Promise<YtDlp | null>;
  /** Boot if needed, then download; streams into `logs`/`progress`. */
  download: (
    url: string,
    opts?: Record<string, unknown>,
  ) => Promise<DownloadResult | null>;
  /** Read an output file produced by a prior download. */
  readFile: (name: string) => Promise<Uint8Array | null>;
  /** Tear down the worker and reset state. */
  terminate: () => void;
}

/**
 * React binding for @local/yt-dlp-wasm: lazily boots a single controller, tracks
 * load status + version + errors, and surfaces live `log`/`progress` during a
 * download. The page must be cross-origin isolated (see `supported`).
 */
export function useYtDlp(): UseYtDlp {
  const [status, setStatus] = useState<YtDlpStatus>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<YtDlpEvents["progress"] | null>(
    null,
  );
  const clientRef = useRef<YtDlp | null>(null);
  const loadingRef = useRef<Promise<YtDlp | null> | null>(null);

  const load = useCallback<UseYtDlp["load"]>((overrides) => {
    if (clientRef.current) return Promise.resolve(clientRef.current);
    if (loadingRef.current) return loadingRef.current;
    setStatus("loading");
    setError(null);
    const pending = (async () => {
      try {
        const client = await createYtDlpClient(overrides);
        const { ytDlpVersion } = await client.load();
        client.on("log", (line) =>
          setLogs((prev) => [...prev.slice(-200), line]),
        );
        client.on("progress", (p) => setProgress(p));
        clientRef.current = client;
        setVersion(ytDlpVersion);
        setStatus("ready");
        return client;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
        return null;
      } finally {
        loadingRef.current = null;
      }
    })();
    loadingRef.current = pending;
    return pending;
  }, []);

  const download = useCallback<UseYtDlp["download"]>(
    async (url, opts) => {
      const client = clientRef.current ?? (await load());
      if (!client) return null;
      setLogs([]);
      setProgress(null);
      try {
        return await client.download(url, opts);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
        return null;
      }
    },
    [load],
  );

  const readFile = useCallback<UseYtDlp["readFile"]>(async (name) => {
    const client = clientRef.current;
    return client ? client.readOutputFile(name) : null;
  }, []);

  const terminate = useCallback(() => {
    clientRef.current?.terminate();
    clientRef.current = null;
    setStatus("idle");
    setVersion(null);
    setProgress(null);
  }, []);

  return {
    status,
    version,
    error,
    supported: isSupported(),
    logs,
    progress,
    load,
    download,
    readFile,
    terminate,
  };
}
