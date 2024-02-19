import dropsRouter from "./drops";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  ping: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/ping",
      },
    })
    .query(() => "pong"),
  drops: dropsRouter,
});

export type AppRouter = typeof appRouter;
