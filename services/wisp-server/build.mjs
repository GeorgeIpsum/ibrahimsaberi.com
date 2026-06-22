import { build } from "esbuild";

// Bundle the Node entry into a single self-contained file for Docker/VPS.
// (The Cloudflare Worker entry is bundled by wrangler, not here.)
await build({
  entryPoints: { node: "src/node/index.ts" },
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: true,
  // Emit .mjs so the Docker run stage (no package.json) treats it as ESM.
  outExtension: { ".js": ".mjs" },
  // ws optionally `require()`s these native addons for speed; leave them
  // external so the bundle runs whether or not they're installed.
  external: ["bufferutil", "utf-8-validate"],
  // ws is CommonJS and calls require() for those optional addons — provide one
  // in the ESM output so the runtime resolves (and gracefully skips) them.
  banner: {
    js: "import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);",
  },
});
console.log("wisp-server: node build complete");
