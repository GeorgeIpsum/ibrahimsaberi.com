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
});

export type AppRouter = typeof appRouter;
