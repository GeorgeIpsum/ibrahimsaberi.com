import { createEnv } from "@t3-oss/env-nextjs";
import e from "dotenv";
import { z } from "zod";

try {
  e.config({ path: "../.env" });
} catch (e) {
  console.warn(e);
}

export default createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BASIN_URL: z.string().url(),
    AWS_AK_ID: z.string(),
    AWS_SAK: z.string(),
  },
  client: {},
  shared: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BASIN_URL: process.env.BASIN_URL,
    AWS_AK_ID: process.env.AWS_AK_ID,
    AWS_SAK: process.env.AWS_SAK,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
  onInvalidAccess: (accessedVar) => {
    console.error("%s was accessed incorrectly", accessedVar);
  },
});
