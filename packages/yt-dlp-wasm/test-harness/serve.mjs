import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname; // packages/yt-dlp-wasm
const PORT = 8787;
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".map": "application/json",
  ".wasm": "application/wasm",
};

createServer(async (req, res) => {
  // Cross-origin isolation — required for SharedArrayBuffer.
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  const urlPath = req.url === "/" ? "/test-harness/index.html" : req.url;
  const filePath = normalize(join(ROOT, decodeURIComponent(urlPath.split("?")[0])));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    res.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
    res.writeHead(200).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`harness: http://localhost:${PORT}`));
