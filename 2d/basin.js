const fm = require("front-matter");
const fs = require("node:fs");
const path = require("node:path");
const { LRUCache } = require("lru-cache");

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

let scanning = false;
const scanDrops = async () => {
  if (scanning) return;
  scanning = true;
  const drops = fs.readdirSync(basinPath);
  try {
    const data = await Promise.all(
      drops.map((dropName) => {
        const dropPath = path.resolve(basinPath, dropName);
        return readFile(dropPath).catch(() => null);
      })
    );
    data.forEach((drop, index) => {
      const d = fm(drop);
      let slug = getMdxSlug(drops[index]);
      if (d.attributes.slug) {
        slug = d.attributes.slug;
      }
      dropCache.set(slug, d);
    });
  } catch (e) {
    console.error(e);
  }
  scanning = false;
};

// scan file system and build initial cache
scanDrops().catch((e) => {
  console.error(e);
});

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
    return {
      status: 404,
      body: null,
    };
  }
  const dropData = getPost(slug);

  return {
    status: dropData ? 200 : 404,
    body: dropData ? JSON.stringify(dropData.drop) : "",
  };
}

// TODO: this
// if (process.env.NODE_ENV === "production") {
//   const chokidar = require("chokidar");
//   const watcher = chokidar.watch(basinPath, { awaitWriteFinish: true });
//   watcher.on("add", (path) => {
//     console.log("asdf", path);
//   });
// }

module.exports = {
  handler,
};
