import type { PyodideInterface } from "pyodide";
import type { SabRequester } from "../bridge/sab";
import {
  type PyodideBootConfig,
  resolvePyodideIndexURL,
  resolveYtDlpInstall,
} from "./config";
// Inlined at build via esbuild's .py text loader (see build.mjs).
import bridgePy from "./py/bridge.py";

export interface PyodideRuntime {
  pyodide: PyodideInterface;
  ytDlpVersion: string;
}

export async function bootPyodide(
  config: PyodideBootConfig,
  requester: SabRequester,
): Promise<PyodideRuntime> {
  const indexURL = resolvePyodideIndexURL(config);

  // Load the loader from the CDN at runtime. A computed specifier keeps the
  // bundler from resolving it; it is a cross-origin ESM (jsDelivr sends CORS,
  // so it is COEP-compatible).
  const loaderUrl = `${indexURL}pyodide.mjs`;
  const { loadPyodide } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ loaderUrl
  )) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  };

  const pyodide = await loadPyodide({ indexURL });

  // Expose the synchronous bridge to Python. `call` blocks THIS worker thread
  // on Atomics.wait until the services worker answers — legal off-main-thread.
  pyodide.registerJsModule("ytdlp_bridge_js", {
    call: (op: number, payload: Uint8Array): Uint8Array =>
      requester.call(op, payload),
  });
  pyodide.runPython(bridgePy);

  // Install yt-dlp. micropip from PyPI is the default; a URL source installs a
  // single wheel with deps disabled (enough for `import yt_dlp` + version).
  await pyodide.loadPackage("micropip");
  const install = resolveYtDlpInstall(config.ytDlpSource);
  pyodide.globals.set(
    "_yt_dlp_spec",
    install.kind === "url" ? install.url : install.spec,
  );
  await pyodide.runPythonAsync(
    install.kind === "url"
      ? "import micropip; await micropip.install(_yt_dlp_spec, deps=False)"
      : "import micropip; await micropip.install(_yt_dlp_spec)",
  );

  const ytDlpVersion = pyodide.runPython(
    "import yt_dlp; yt_dlp.version.__version__",
  ) as string;

  return { pyodide, ytDlpVersion };
}
