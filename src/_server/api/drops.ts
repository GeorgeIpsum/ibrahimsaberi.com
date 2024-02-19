import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "./trpc";

const dropsRouter = createTRPCRouter({
  all: publicProcedure.input(z.string()).query(({ ctx: { db } }) => {
    return db.post.findMany();
  }),
  bySlug: publicProcedure
    .input(z.string().min(1))
    .query(({ ctx: { db }, input }) => {
      return db.post.findUnique({ where: { slug: input } });
    }),
  byAuthor: publicProcedure
    .input(z.string())
    .query(({ ctx: { db }, input }) => {
      return db.author.findMany({ where: { username: { contains: input } } });
    }),
  byCategory: publicProcedure
    .input(z.string().min(1))
    .query(({ ctx: { db }, input }) => {
      return db.category.findMany({ where: { name: { contains: input } } });
    }),
});

export default dropsRouter;
