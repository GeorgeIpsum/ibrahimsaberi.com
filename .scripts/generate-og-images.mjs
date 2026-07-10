/**
 * Build all Open Graph images in .og-image.rc.json
 * and write them to public/og
 *
 * Also double checks relevant page/ layout files referenced
 * in the config to make sure they reference the generated image
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import * as lab from "@lucide/lab";

const precept = "ℑ";
console.log(`${precept} OG Image Generator 1.0.0`);
console.log(`Node ${process.version}`);
console.log("  Generating Open Graph images ...\n");
const now = performance.now();

// esm = broke
const require = createRequire(import.meta.url);
const { ImageResponse } = await import(
  pathToFileURL(require.resolve("next/og")).href
);

/**
 * @typedef {{ type: string, props: Record<string, unknown> }} SatoriNode
 * @typedef {[tag: string, attrs: Record<string, unknown>][]} IconNode
 * @typedef {{ text: string, fontWeight?: number, color?: string }} TitleSpan
 * @typedef {{
 *   route: string,
 *   output: string,
 *   template?: "home" | "page",
 *   title?: string | TitleSpan[],
 *   subtitle?: string,
 *   icon?: string,
 *   backgroundColor?: string,
 *   color?: string,
 * }} OgEntry
 */

const root = process.cwd();
const SIZE = { width: 1200, height: 630 };

/**
 * @param {string} type
 * @param {Record<string, unknown>} [props]
 * @param {unknown} [children]
 * @returns {SatoriNode}
 */
const el = (type, props = {}, children) => ({
  type,
  props: children === undefined ? props : { ...props, children },
});

/** @param {string} name */
const fontFile = (name) =>
  readFile(join(root, "public", "fonts", "Platypi", "static", name));

const [lightFont, mediumFont, boldFont, logo] = await Promise.all([
  fontFile("Platypi-Light.ttf"),
  fontFile("Platypi-Medium.ttf"),
  fontFile("Platypi-Bold.ttf"),
  readFile(join(root, "public", "is.svg"), "base64"),
]);

const fonts = [
  { name: "Platypi", data: lightFont, weight: 400, style: "normal" },
  { name: "Platypi", data: mediumFont, weight: 500, style: "normal" },
  { name: "Platypi", data: boldFont, weight: 600, style: "normal" },
];

/** @param {number} size */
const logoImg = (size) =>
  el("img", {
    src: `data:image/svg+xml;base64,${logo}`,
    width: size,
    height: size,
  });

/**
 * @param {string | TitleSpan[]} t
 * @returns {SatoriNode | SatoriNode[]}
 */
const title = (t) =>
  typeof t === "string"
    ? el("span", {}, t)
    : t.map(({ text, fontWeight, color }, i) => {
        /** @type {Record<string, unknown>} */
        const style = {};
        if (fontWeight !== undefined) style.fontWeight = fontWeight;
        if (color !== undefined) style.color = color;
        return el("span", { key: i, style }, text);
      });

// Mirrors src/app/opengraph-image.tsx (deleted in favor of this script).
const homeTemplate = () =>
  el(
    "div",
    {
      style: {
        fontSize: 108,
        background: "#070b04",
        color: "#dbead3",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    el(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        },
      },
      [
        logoImg(256),
        el(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              lineHeight: 0.6,
              marginLeft: 30,
              marginBottom: 30,
              letterSpacing: -2,
            },
          },
          [
            el(
              "div",
              {
                style: { fontFamily: "Platypi", fontWeight: 500, opacity: 0.6 },
              },
              "a whisper",
            ),
            el(
              "div",
              {
                style: {
                  fontFamily: "Platypi",
                  fontWeight: 300,
                  letterSpacing: 2,
                },
              },
              "a wave",
            ),
          ],
        ),
      ],
    ),
  );

// Mirrors src/features/og/create-og-image.tsx.
/**
 * @param {OgEntry} entry
 * @returns {SatoriNode}
 */
const pageTemplate = (entry) => {
  if (!entry.title || !entry.icon) {
    throw new Error(`${entry.output}: page template needs a title and icon`);
  }
  const icons = /** @type {Record<string, IconNode | undefined>} */ (
    /** @type {unknown} */ (lab)
  );
  const icon = icons[entry.icon];
  if (!icon) {
    throw new Error(
      `${entry.output}: "${entry.icon}" is not an @lucide/lab export`,
    );
  }

  return el(
    "div",
    {
      style: {
        fontSize: 108,
        background: entry.backgroundColor ?? "#070b04",
        color: entry.color ?? "#dbead3",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Platypi",
        fontWeight: 400,
      },
    },
    [
      el(
        "svg",
        {
          color: "currentColor",
          stroke: "currentColor",
          width: 256,
          height: 256,
          viewBox: "0 0 24 24",
          strokeWidth: "1.2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "none",
          opacity: "0.3",
          xmlns: "http://www.w3.org/2000/svg",
        },
        icon.map(([tag, attrs]) => el(tag, attrs)),
      ),
      el(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            lineHeight: 0.8,
          },
        },
        [
          el(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 48,
                marginRight: 48,
              },
            },
            title(entry.title),
          ),
          entry.subtitle
            ? el("div", { style: { fontSize: 48 } }, entry.subtitle)
            : null,
        ],
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            position: "absolute",
            bottom: 24,
            left: 24,
            width: 48,
            height: 48,
          },
        },
        logoImg(48),
      ),
    ],
  );
};

// Resolve a route like "/fm" to its src/app directory, ignoring route groups
// such as "(root)". Returns every matching directory (route groups can make
// the same path reachable more than one way).
/**
 * @param {string} route
 * @returns {Promise<string[]>}
 */
const routeDirs = async (route) => {
  const segments = route.split("/").filter(Boolean);
  /** @type {string[]} */
  const matches = [];
  /** @type {(dir: string, remaining: string[]) => Promise<void>} */
  const walk = async (dir, remaining) => {
    if (remaining.length === 0) {
      matches.push(dir);
      // route groups below this dir could also hold the page — keep walking
    }
    for (const child of await readdir(dir, { withFileTypes: true })) {
      if (!child.isDirectory()) continue;
      const next = join(dir, child.name);
      if (child.name.startsWith("(") && child.name.endsWith(")")) {
        await walk(next, remaining);
      } else if (remaining[0] === child.name) {
        await walk(next, remaining.slice(1));
      }
    }
  };
  await walk(join(root, "src", "app"), segments);
  return matches;
};

// The page (or its layout) must reference the generated image in its
// metadata; otherwise the image exists but nothing links it.
/** @param {OgEntry} entry */
const verifyRouteMetadata = async (entry) => {
  const dirs = await routeDirs(entry.route);
  if (dirs.length === 0) {
    throw new Error(`${entry.route}: no matching directory under src/app`);
  }
  const url = `/og/${entry.output}`;
  /** @type {string[]} */
  const checked = [];
  for (const dir of dirs) {
    for (const file of ["page.tsx", "layout.tsx"]) {
      const path = join(dir, file);
      try {
        if ((await readFile(path, "utf8")).includes(url)) return;
        checked.push(relative(root, path));
      } catch {
        // file doesn't exist in this dir; keep looking
      }
    }
  }
  throw new Error(
    `${entry.route}: no metadata references ${url} (checked: ${checked.join(", ") || "no page/layout found"})`,
  );
};

/** @type {{ outDir: string, images: OgEntry[] }} */
const config = JSON.parse(
  await readFile(join(root, ".og-image.rc.json"), "utf8"),
);
if (!config.outDir || !Array.isArray(config.images)) {
  throw new Error(".og-image.rc.json needs an outDir and an images array");
}

const outDir = join(root, config.outDir);
await mkdir(outDir, { recursive: true });

const longestImagePath = Math.max(...config.images.map((i) => i.output.length));
const paddingLength = longestImagePath; // add a little padding for readability
console.log(
  `${"Route (app)".padEnd(paddingLength + 6, " ")} ${"Output".padEnd(paddingLength, " ")} Size`,
);

for (const [i, entry] of config.images.entries()) {
  if (!entry.output || !entry.route) {
    throw new Error("config entry is missing an output name or route");
  }
  const tree = entry.template === "home" ? homeTemplate() : pageTemplate(entry);
  const res = new ImageResponse(tree, { ...SIZE, fonts });
  const png = Buffer.from(await res.arrayBuffer());
  await writeFile(join(outDir, entry.output), png);
  await verifyRouteMetadata(entry);
  const isFirst = i === 0;
  const isLast = i === config.images.length - 1;
  console.log(
    `${isFirst ? "┌" : isLast ? "└" : "├"} ${precept} ${entry.route.padEnd(paddingLength, " ")} → ${entry.output.padEnd(paddingLength, " ")} (${(png.length / 1024).toFixed(0)}kb)`,
  );
}

console.log(
  `\nOpenGraph Images Generated in /public [${(performance.now() - now).toFixed(0)}ms]`,
);
console.log(`Complete ${precept}\n`);
