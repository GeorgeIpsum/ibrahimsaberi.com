import type { PyodideInterface } from "pyodide";
import type { SabRequester } from "../bridge/sab";
import {
  type PyodideBootConfig,
  resolvePyodideIndexURL,
  resolveYtDlpInstall,
} from "./config";
// Inlined at build via esbuild's .py text loader (see build.mjs).
import bridgePy from "./py/bridge.py";
import ffprobePy from "./py/ffprobe_compat.py";
import fsPy from "./py/fs.py";
import subprocessPy from "./py/subprocess_shim.py";

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

  // Install the Python shim modules onto sys.path, then patch subprocess so
  // yt-dlp's ffmpeg/ffprobe calls route into ffmpeg.wasm via the bridge.
  pyodide.globals.set("_fs_py", fsPy);
  pyodide.globals.set("_ffprobe_py", ffprobePy);
  pyodide.globals.set("_subprocess_py", subprocessPy);
  pyodide.runPython(`
import os, sys
_dir = "/tmp/ytdlp_py"
os.makedirs(_dir, exist_ok=True)
if _dir not in sys.path:
    sys.path.insert(0, _dir)
for _name, _src in (("fs", _fs_py), ("ffprobe_compat", _ffprobe_py), ("subprocess_shim", _subprocess_py)):
    with open(os.path.join(_dir, _name + ".py"), "w") as _f:
        _f.write(_src)
import subprocess_shim
subprocess_shim.install()
`);

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
