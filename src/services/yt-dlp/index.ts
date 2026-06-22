// Public surface for the yt-dlp-wasm app integration.

// Re-export the package's public types for app consumers.
export type { YtDlp, YtDlpConfig, YtDlpEvents } from "@local/yt-dlp-wasm";
export {
  createBridgeClient,
  createYtDlpClient,
  isSupported,
  loadModule,
} from "./client";
export {
  baseConfig,
  isDemoWisp,
  PACKAGE_BASE,
  PACKAGE_ENTRY,
  resolveWispUrl,
  WHEEL_MANIFEST_URL,
  type WheelManifest,
  wheelUrl,
} from "./config";
export {
  type DownloadResult,
  type UseYtDlp,
  useYtDlp,
  type YtDlpStatus,
} from "./use-yt-dlp";
