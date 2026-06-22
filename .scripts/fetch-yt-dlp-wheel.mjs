import { mkdir, writeFile } from "node:fs/promises";
import { type } from "arktype";

const wheelUrlSchema = type({
  packagetype: "string",
  filename: "string",
  url: "string",
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
  await writeFile(`${OUT_DIR}/${wheel.filename}`, bytes);
  await writeFile(
    `${OUT_DIR}/manifest.json`,
    JSON.stringify({ wheel: wheel.filename, version: parsed.info.version }),
  );
  console.log(`wrote ${OUT_DIR}/${wheel.filename} (${bytes.length} bytes)`);
  console.log(`version: ${parsed.info.version}`);
};

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
