import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";
import { type } from "arktype";

const wheelUrlSchema = type({
  packagetype: "string",
  filename: "string",
  url: "string",
  digests: {
    sha256: "string",
  },
});

const wheelMetaSchema = type({
  info: {
    version: "string",
  },
  urls: wheelUrlSchema.array(),
  releases: type.Record("string", wheelUrlSchema.array()).optional(),
});

const main = async () => {
  const OUT_DIR = "public/yt-dlp-wheels";

  const meta = await (await fetch("https://pypi.org/pypi/yt-dlp/json")).json();
  const parsed = wheelMetaSchema(meta);

  if (parsed instanceof type.errors) {
    console.error("yt-dlp wheel metadata failed schema validation:", parsed);
    throw new Error("yt-dlp wheel metadata failed schema validation");
  }

  /**
   * @type {{packagetype: string, filename: string, url: string}[]}
   */
  const files = parsed.urls ?? parsed.releases?.[parsed.info.version] ?? [];
  const wheel = files.find(
    (f) =>
      f.packagetype === "bdist_wheel" &&
      f.filename.endsWith("py3-none-any.whl"),
  );
  if (!wheel) throw new Error("no py3-none-any wheel found for yt-dlp");
  await mkdir(OUT_DIR, { recursive: true });
  const bytes = new Uint8Array(await (await fetch(wheel.url)).arrayBuffer());

  const actual = createHash("sha256").update(bytes).digest("hex");
  const expected = wheel.digests.sha256.toLowerCase();
  if (actual !== expected) {
    throw new Error(
      `yt-dlp wheel SHA-256 mismatch: PyPI says ${expected}, downloaded ${actual}`,
    );
  }

  await writeFile(`${OUT_DIR}/${wheel.filename}`, bytes);
  await writeFile(
    `${OUT_DIR}/manifest.json`,
    JSON.stringify({
      wheel: wheel.filename,
      version: parsed.info.version,
      sha256: actual,
    }),
  );
  console.log(`wrote ${OUT_DIR}/${wheel.filename} (${bytes.length} bytes)`);
  console.log(`sha256: ${actual}`);
  console.log(`version: ${parsed.info.version}`);
};

// Run when invoked directly (`node .scripts/fetch-yt-dlp-wheel.mjs`, used by the
// npm script + CI). The commander runner (.scripts/index.js) imports this module
// and calls main() itself, so guard on being the entrypoint to avoid a double run.
if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  await main();
}

export default {
  main,
  meta: {
    command: "fetch-yt-dlp-wheel",
    description:
      "Fetch the latest yt-dlp py3-none-any wheel and save it to public/yt-dlp-wheels.",
    opts: [],
    args: [],
  },
};
