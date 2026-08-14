import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

export const env = createEnv({
  server: {
    SPOTIFY_CLIENT_ID: type("string > 0"),
    SPOTIFY_CLIENT_SECRET: type("string > 0"),
    SPOTIFY_REFRESH_TOKEN: type("string > 0"),
    REDIS_KV_REST_API_TOKEN: type("string > 0"),
    REDIS_KV_REST_API_URL: type("string > 0"),
    OPENWEATHERMAP_API_KEY: type("string | undefined"),
    LE_PLATFORM_API_KEY: type("string | undefined"),
    CLOUDFLARE_VOICE_PUBLIC_URL: type("string | undefined"),
  },
  client: {},
  runtimeEnv: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN,
    REDIS_KV_REST_API_TOKEN: process.env.REDIS_KV_REST_API_TOKEN,
    REDIS_KV_REST_API_URL: process.env.REDIS_KV_REST_API_URL,
    OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
    LE_PLATFORM_API_KEY: process.env.LE_PLATFORM_API_KEY,
    CLOUDFLARE_VOICE_PUBLIC_URL: process.env.CLOUDFLARE_VOICE_PUBLIC_URL,
  },
  emptyStringAsUndefined: true,
});
