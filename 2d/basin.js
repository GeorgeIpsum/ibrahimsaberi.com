const chokidar = require("chokidar");
const fm = require("front-matter");
const fs = require("node:fs");
const path = require("node:path");
const { LRUCache } = require("lru-cache");
require("colors");
const Diff = require("diff");

const readFile = async (filePath) => {
  return new Promise((res, rej) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
};

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

const getMdxSlug = (mdxFile) => mdxFile.split(".mdx")[0];

const basinPath = path.resolve(__dirname, "..", "basin");

const scanDrop = (dropPath, a1 = "start", a2 = "finish") => {
  console.log(`[${a1.toUpperCase()} FILE]:`, dropPath);
  try {
    const dropFile = fs.readFileSync(
      path.resolve(basinPath, dropPath),
      "utf-8"
    );
    const fmDrop = fm(dropFile);
    const currentDrop = dropCache.get(getMdxSlug(dropPath));
    if (currentDrop) {
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
    console.log(`[${a2.toUpperCase()} FILE]:`, dropPath);
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
