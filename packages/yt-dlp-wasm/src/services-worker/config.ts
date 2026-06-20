/** Pinned @ffmpeg/core-mt version (CDN assets). Keep in sync with the @ffmpeg/* devDeps. */
export const FFMPEG_CORE_VERSION = "0.12.10";
/** Pinned @ffmpeg/ffmpeg version (for the class-worker blob). Set to the installed devDep in Task 2. */
export const FFMPEG_PKG_VERSION = "0.12.15";

export interface FfmpegConfig {
  /** Override the core-mt asset base dir (no trailing slash). Default: jsDelivr esm. */
  ffmpegCoreBaseURL?: string;
  /** Override the @ffmpeg/ffmpeg class-worker URL. Default: jsDelivr esm worker.js. */
  ffmpegClassWorkerURL?: string;
}

export interface FfmpegCoreUrls {
  coreURL: string;
  wasmURL: string;
  workerURL: string;
  classWorkerURL: string;
}

export function resolveFfmpegCore(config: FfmpegConfig = {}): FfmpegCoreUrls {
  const base =
    config.ffmpegCoreBaseURL ??
    `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm`;
  const classWorkerURL =
    config.ffmpegClassWorkerURL ??
    `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_PKG_VERSION}/dist/esm/worker.js`;
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    workerURL: `${base}/ffmpeg-core.worker.js`,
    classWorkerURL,
  };
}
