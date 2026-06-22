// Pure configuration helpers for the Pyodide worker. No DOM/worker globals and
// no .py imports — safe to unit-test under vitest (node).

/**
 * Pinned Pyodide version. MUST match the `pyodide` devDependency so the CDN
 * assets loaded at runtime match the TypeScript types compiled against.
 */
export const PYODIDE_VERSION = "314.0.0";

export type YtDlpSource = "micropip" | { url: string };

export interface PyodideBootConfig {
  /** Override the Pyodide asset base URL. Default: jsDelivr CDN for PYODIDE_VERSION. */
  pyodideIndexURL?: string;
  /** Where to load yt-dlp from. Default: micropip from PyPI/jsDelivr. */
  ytDlpSource?: YtDlpSource;
}

/** Resolve the Pyodide `indexURL` (asset base; always ends with a slash). */
export function resolvePyodideIndexURL(config: PyodideBootConfig = {}): string {
  const override = config.pyodideIndexURL;
  if (override) return override.endsWith("/") ? override : `${override}/`;
  return `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
}

export type YtDlpInstall =
  | { kind: "micropip"; spec: string }
  | { kind: "url"; url: string };

/** Resolve how to install yt-dlp inside Pyodide. */
export function resolveYtDlpInstall(
  source: YtDlpSource = "micropip",
): YtDlpInstall {
  if (source === "micropip") return { kind: "micropip", spec: "yt-dlp" };
  return { kind: "url", url: source.url };
}
