import type { YtDlp, YtDlpConfig } from "@local/yt-dlp-wasm";
import {
  baseConfig,
  PACKAGE_ENTRY,
  WHEEL_MANIFEST_URL,
  type WheelManifest,
  wheelUrl,
} from "./config";

// The runtime module shape mirrors the workspace package's types, but it is
// loaded at runtime from PACKAGE_ENTRY (public/ or an R2-backed rewrite) — never
// bundled. `typeof import(...)` is a type query only, so nothing is imported.
type YtDlpModule = typeof import("@local/yt-dlp-wasm");

/** SharedArrayBuffer requires a cross-origin-isolated page (COOP/COEP). */
export function isSupported(): boolean {
  return typeof self !== "undefined" && self.crossOriginIsolated === true;
}

let modulePromise: Promise<YtDlpModule> | null = null;

/** Load the prebuilt package ESM from PACKAGE_ENTRY (cached per page). */
export function loadModule(): Promise<YtDlpModule> {
  if (!modulePromise) {
    // Variable specifier + bundler-ignore comments keep Turbopack/webpack from
    // resolving or rewriting the URL; the package's worker URLs must resolve
    // relative to this path at runtime.
    const specifier = PACKAGE_ENTRY;
    modulePromise = import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ specifier
    ) as Promise<YtDlpModule>;
  }
  return modulePromise;
}

async function resolveWheelSource(): Promise<{ url: string }> {
  const manifest = (await (
    await fetch(WHEEL_MANIFEST_URL)
  ).json()) as WheelManifest;
  return { url: wheelUrl(manifest.wheel) };
}

/**
 * Boot a yt-dlp client: load the package, resolve the wheel from its manifest,
 * and construct a controller with the env-resolved config. `overrides` win over
 * the defaults (e.g. pass `{ ytDlpSource: "micropip" }` or a different wispUrl).
 *
 * Throws if the page is not cross-origin isolated.
 */
export async function createYtDlpClient(
  overrides: Partial<YtDlpConfig> = {},
): Promise<YtDlp> {
  if (!isSupported()) {
    throw new Error(
      "yt-dlp-wasm needs a cross-origin-isolated page (COOP: same-origin, COEP: require-corp).",
    );
  }
  const { createYtDlp } = await loadModule();
  const ytDlpSource = overrides.ytDlpSource ?? (await resolveWheelSource());
  return createYtDlp({ ...baseConfig(), ytDlpSource, ...overrides });
}

/**
 * A bare controller with no yt-dlp install — for exercising the sync bridge
 * (e.g. `ping`) without booting Python. Honors `dataCapacity`.
 */
export async function createBridgeClient(
  config: Partial<YtDlpConfig> = {},
): Promise<YtDlp> {
  if (!isSupported()) {
    throw new Error("yt-dlp-wasm needs a cross-origin-isolated page.");
  }
  const { createYtDlp } = await loadModule();
  return createYtDlp(config);
}
