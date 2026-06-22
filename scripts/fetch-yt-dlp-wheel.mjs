import { mkdir, writeFile } from "node:fs/promises";

const OUT_DIR = "public/yt-dlp-wheels";
const meta = await (await fetch("https://pypi.org/pypi/yt-dlp/json")).json();
const files = meta.urls ?? meta.releases?.[meta.info.version] ?? [];
const wheel = files.find(
  (f) =>
    f.packagetype === "bdist_wheel" && f.filename.endsWith("py3-none-any.whl"),
);
if (!wheel) throw new Error("no py3-none-any wheel found for yt-dlp");
await mkdir(OUT_DIR, { recursive: true });
const bytes = new Uint8Array(await (await fetch(wheel.url)).arrayBuffer());
await writeFile(`${OUT_DIR}/${wheel.filename}`, bytes);
await writeFile(
  `${OUT_DIR}/manifest.json`,
  JSON.stringify({ wheel: wheel.filename, version: meta.info.version }),
);
console.log(`wrote ${OUT_DIR}/${wheel.filename} (${bytes.length} bytes)`);
console.log(`version: ${meta.info.version}`);
