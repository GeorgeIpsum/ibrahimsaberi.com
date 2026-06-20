import { build, context } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    index: "src/index.ts",
    "pyodide-worker/worker": "src/pyodide-worker/worker.ts",
    "services-worker/worker": "src/services-worker/worker.ts",
  },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  splitting: false,
  sourcemap: true,
  loader: { ".py": "text" },
  external: [
    "pyodide",
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@ffmpeg/core-mt",
    "libcurl.js",
  ],
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("yt-dlp-wasm: esbuild watching…");
} else {
  await build(options);
  console.log("yt-dlp-wasm: build complete");
}
