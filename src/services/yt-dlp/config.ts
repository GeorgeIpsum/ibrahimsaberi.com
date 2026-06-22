import type { YtDlpConfig } from "@local/yt-dlp-wasm";

// Integration config for @local/yt-dlp-wasm. Everything is env-driven so the
// same code runs against same-origin assets (local dev / Vercel public/) or a
// CDN — see next.config `rewrites()` for backing the same-origin paths with R2.

// The package entry + its workers MUST be same-origin: the package spawns module
// workers via `new Worker(new URL(..., import.meta.url))`, and Workers cannot be
// loaded cross-origin. Back this path with R2 via a rewrite, not by pointing it
// at a cross-origin URL.
export const PACKAGE_BASE = "/yt-dlp-wasm";
export const PACKAGE_ENTRY = `${PACKAGE_BASE}/index.js`;

// The wheel is `fetch`ed, so it may be cross-origin (with CORS); default
// same-origin. Pyodide + the ffmpeg core load via import()/toBlobURL and may be
// cross-origin too — they default to jsDelivr inside the package.
const WHEEL_BASE = process.env.NEXT_PUBLIC_YTDLP_WHEEL_BASE ?? "/yt-dlp-wheels";
export const WHEEL_MANIFEST_URL = `${WHEEL_BASE}/manifest.json`;

export interface WheelManifest {
  wheel: string;
  version: string;
}

/** Absolute URL for a wheel file named in the manifest. */
export function wheelUrl(file: string): string {
  if (/^https?:\/\//.test(WHEEL_BASE)) return `${WHEEL_BASE}/${file}`;
  const origin = typeof location !== "undefined" ? location.origin : "";
  return `${origin}${WHEEL_BASE}/${file}`;
}

/**
 * Wisp endpoint for libcurl.js networking. Defaults to the public demo (testing
 * only); set NEXT_PUBLIC_WISP_URL to your own server (see services/wisp-server).
 * NEXT_PUBLIC_WISP_TOKEN, if set, is appended as ?token=.
 */
export function resolveWispUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_WISP_URL ?? "wss://wisp.mercurywork.shop/";
  const token = process.env.NEXT_PUBLIC_WISP_TOKEN;
  if (!token) return base;
  try {
    const url = new URL(base);
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return base;
  }
}

/** True when the public demo proxy is in use (no NEXT_PUBLIC_WISP_URL set). */
export function isDemoWisp(): boolean {
  return !process.env.NEXT_PUBLIC_WISP_URL;
}

/**
 * Base YtDlpConfig (no `ytDlpSource` — that needs the fetched wheel manifest).
 * Adds pyodide/ffmpeg overrides only when their env vars are set, so the
 * package's jsDelivr defaults apply otherwise.
 */
export function baseConfig(): YtDlpConfig {
  const cfg: YtDlpConfig = { wispUrl: resolveWispUrl() };
  const pyodide = process.env.NEXT_PUBLIC_YTDLP_PYODIDE_URL;
  if (pyodide) cfg.pyodideIndexURL = pyodide;
  const ffmpeg = process.env.NEXT_PUBLIC_YTDLP_FFMPEG_BASE;
  if (ffmpeg) cfg.ffmpegCoreBaseURL = ffmpeg;
  return cfg;
}
