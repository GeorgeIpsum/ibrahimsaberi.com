import { build, context } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    index: "src/index.ts",
    "pyodide-worker/worker": "src/pyodide-worker/worker.ts",
    // Self-contained @ffmpeg/ffmpeg class worker (see ffmpeg-worker.ts). Emitted
    // as a sibling of index.js so it can be served same-origin and loaded
    // without toBlobURL (which breaks the worker's relative imports).
    "ffmpeg-worker": "src/services-worker/ffmpeg-worker.ts",
  },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  splitting: false,
  sourcemap: true,
  loader: { ".py": "text" },
  external: ["pyodide", "@ffmpeg/core-mt", "libcurl.js"],
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("yt-dlp-wasm: esbuild watching…");
} else {
  await build(options);
  console.log("yt-dlp-wasm: build complete");
}
