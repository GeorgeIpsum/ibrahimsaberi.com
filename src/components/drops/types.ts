import type { Post as PrismaPost } from "@prisma/client";

export type Post = Omit<PrismaPost, "content"> & { content: string };
