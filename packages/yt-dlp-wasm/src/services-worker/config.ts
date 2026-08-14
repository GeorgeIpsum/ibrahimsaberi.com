/** Pinned @ffmpeg/core (single-threaded core) version (CDN assets). Keep in sync with the @ffmpeg/* devDeps. */
export const FFMPEG_CORE_VERSION = "0.12.10";

export interface FfmpegConfig {
  /** Override the core asset base dir (no trailing slash). Default: jsDelivr esm. */
  ffmpegCoreBaseURL?: string;
  /**
   * Override the @ffmpeg/ffmpeg class-worker URL. Default: the bundled,
   * same-origin `ffmpeg-worker.js` shipped beside the package entry. Must be
   * same-origin (or a same-origin blob) — Workers can't load cross-origin
   * scripts, and a blob'd ESM worker can't resolve its relative imports.
   */
  ffmpegClassWorkerURL?: string;
  /** Optional lowercase-hex SHA-256 of ffmpeg-core.js; verified before load. */
  coreSha256?: string;
  /** Optional lowercase-hex SHA-256 of ffmpeg-core.wasm; verified before load. */
  wasmSha256?: string;
}

export interface NetConfig {
  /** Wisp WebSocket proxy URL for libcurl.js (required for networking). */
  wispUrl?: string;
}

export interface FfmpegCoreUrls {
  coreURL: string;
  wasmURL: string;
}

export function resolveFfmpegCore(config: FfmpegConfig = {}): FfmpegCoreUrls {
  const base =
    config.ffmpegCoreBaseURL ??
    `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
  };
}
