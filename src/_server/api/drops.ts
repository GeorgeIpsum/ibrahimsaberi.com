import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "./trpc";

const dropsRouter = createTRPCRouter({
  all: publicProcedure.input(z.string()).query(({ ctx: { db } }) => {
    return db.post.findMany();
  }),
  bySlug: publicProcedure
    .input(z.string().min(1))
    .query(async ({ ctx: { db }, input }) => {
      const post = await db.post.findUnique({
        where: { slug: input },
        include: { categories: { include: { category: true } } },
      });
      if (post) {
        return {
          ...post,
          content: Buffer.from(post.content).toString("utf-8"),
        };
      }
      return null;
    }),
  byAuthor: publicProcedure
    .input(z.string())
    .query(({ ctx: { db }, input }) => {
      return db.author.findMany({ where: { username: input } });
    }),
  byCategory: publicProcedure
    .input(z.string().min(1))
    .query(({ ctx: { db }, input }) => {
      return db.category.findMany({ where: { name: input } });
    }),
  searchPosts: publicProcedure
    .input(z.string().min(1))
    .query(async ({ ctx: { db } }) => {}),
  allPosts: publicProcedure.query(async ({ ctx: { db } }) => {
    const posts = (
      await db.post.findMany({
        where: { indexed: true, published: true },
      })
    ).map((post) => ({
      ...post,
      content: Buffer.from(post.content).toString("utf-8"),
    }));
    console.log(posts);
    return posts;
  }),
});

export default dropsRouter;
