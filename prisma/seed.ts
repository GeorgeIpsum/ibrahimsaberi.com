import { type Author, PrismaClient } from "@prisma/client";
import "dotenv/config";
import fm from "front-matter";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const basinPath = path.resolve(__dirname, "..", "basin");

const clearDb = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  try {
    console.info("🆑 CLEARING DATABASE NOW.");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }

  console.info("🆑 DATABASE IS NOW EMPTY.\n");
};

const readFile = (filePath: string) =>
  new Promise<string>((res, rej) =>
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) rej(err);
      res(data);
    })
  );

export async function main() {
  await clearDb();

  const author = await prisma.author.create({
    data: {
      username: "G1N",
      name: "Ibrahim Saberi",
    },
  });
  console.log("Author created.", author);

  if (!author) {
    console.info("No base author present. Exiting.");
    return;
  }

  const dropPaths = fs.readdirSync(basinPath);
  const dropContent = (
    await Promise.all(
      dropPaths.map((dropPath) => readFile(path.resolve(basinPath, dropPath)))
    )
  ).map((drop, index) => ({ file: dropPaths[index], drop: fm(drop) }));

  const posts = await Promise.all(
    dropContent.map(({ file, drop }) => {
      const attributes = drop.attributes as Record<string, any>;
      const indexed =
        !attributes["not-indexed"] ?? attributes["indexed"] ?? true;
      const published = attributes["published"] ?? false;
      const publishDate = attributes["publish-date"]
        ? new Date(attributes["publish-date"])
        : undefined;

      return prisma.post.create({
        data: {
          slug: attributes.slug ?? file.split(".mdx")[0],
          title: attributes.title ?? "",
          blurb: attributes.blurb ?? "",
          indexed: indexed,
          published: published,
          authorUsername: author!.username,
          publishedAt: publishDate,
          content: Buffer.from(drop.body),
        },
      });
    })
  );

  console.info(
    "Posts created.",
    posts.map((p) => p.slug)
  );
}

main();
