import { initTRPC } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { OpenApiMeta } from "trpc-openapi";
import { ZodError } from "zod";

interface CreateContextOptions {
  headers: Headers;
}

interface Meta extends OpenApiMeta {}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    headers: opts.headers,
  };
};

export const createTRPCContext = (opts: { req: NextRequest }) => {
  return createInnerTRPCContext({
    headers: opts.req.headers,
  });
};

const t = initTRPC
  .meta<Meta>()
  .context<typeof createTRPCContext>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export type Context = ReturnType<typeof createTRPCContext>;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;
