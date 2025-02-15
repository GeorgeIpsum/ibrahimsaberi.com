const chokidar = require("chokidar");
const fm = require("front-matter");
const fs = require("node:fs");
const path = require("node:path");
const { LRUCache } = require("lru-cache");
require("colors");
const Diff = require("diff");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const dropCache = new LRUCache({
  maxSize: 100,
  sizeCalculation: (value, key) => {
    if (typeof value === "string") {
      return Math.ceil(value.length / 10);
    }
    return 1;
  },
  ttl: 1000 * 60 * 60 * 24,
  updateAgeOnGet: true,
});

const getMdxSlug = (mdxFile, fm) => {
  if (fm?.attributes?.slug) return fm.attributes.slug;
  const toPaths = mdxFile.split("/");
  const fileName = toPaths[toPaths.length - 1];
  return fileName.split(".mdx")[0];
};

const basinPath = path.resolve(__dirname, "..", "basin");

const scanDrop = async (dropPath, a1 = "start", a2 = "finish") => {
  const len = a1.length - a2.length < 0 ? a2.length : a1.length;
  console.info(
    `[${a1.toUpperCase()} FILE]:`.padEnd(len + 8),
    dropPath.split("basin/")[1]
  );
  try {
    const dropFile = fs.readFileSync(
      path.resolve(basinPath, dropPath),
      "utf-8"
    );
    const fmDrop = fm(dropFile);
    const slug = getMdxSlug(dropPath, fmDrop);
    const currentDrop = dropCache.get(slug);
    if (currentDrop) {
      await prisma.post.update({
        where: { slug: getMdxSlug(dropPath) },
        data: { content: Buffer.from(fmDrop.body, "utf-8") },
      });
      const diff = Diff.diffChars(currentDrop.body, fmDrop.body);
      diff.forEach((part) => {
        // green for additions, red for deletions
        let text = part.added
          ? part.value.bgGreen
          : part.removed
            ? part.value.bgRed
            : part.value;
        process.stderr.write(text);
      });

      console.log();
    }
    dropCache.set(getMdxSlug(dropPath), fmDrop);
    console.info(
      `[${a2.toUpperCase()} FILE]:`.padEnd(len + 8),
      dropPath.split("basin/")[1]
    );
  } catch (e) {
    console.log(e);
  }
};

// scan file system and build initial cache
const watcher = chokidar.watch(basinPath, { awaitWriteFinish: true });
watcher.on("add", (path) => scanDrop(path, "adding", "added"));
watcher.on("change", (path) => scanDrop(path, "changing", "changed"));

const getPost = (slug) => {
  const cacheValue = dropCache.get(slug);
  if (cacheValue) return { from: "cache", drop: cacheValue };

  try {
    const dropPath = path.resolve(basinPath, slug + ".mdx");
    const exists = fs.existsSync(dropPath);
    if (exists) {
      const drop = fs.readFileSync(dropPath, "utf-8");
      const dropFm = fm(drop);
      if (dropFm && dropFm.body) {
        dropCache.set(slug, dropFm);
        return { from: "file", drop: dropFm };
      }
    }
  } catch (e) {
    console.error(e);
  }

  return null;
};

async function handler(req, res) {
  const slug = req.url.split("/")[2];
  if (!slug) {
    const posts = [];
    for (const [slug, drop] of dropCache.entries()) {
      posts.push({ slug, drop });
    }
    return {
      status: 200,
      body: JSON.stringify({ posts }),
    };
  }
  const dropData = getPost(slug);

  return {
    status: dropData ? 200 : 404,
    body: dropData ? JSON.stringify(dropData.drop) : "",
  };
}

module.exports = {
  handler,
};
