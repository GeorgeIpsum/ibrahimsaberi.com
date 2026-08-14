import "server-only";
import { env } from "@/env";

type TokenCache = { accessToken: string; expiresAt: number };

// Module-scoped cache is the ONLY cache for the access token. The token fetch
// itself uses `cache: "no-store"` — Next-caching it would let a stale-while-
// revalidate hit return an already-expired token while the module cache trusts
// `expires_in` relative to now, masking the real expiry.
let cache: TokenCache | null = null;
const SAFETY_WINDOW_MS = 60_000;

/** Drop the cached token so the next getAccessToken() forces a fresh refresh. */
export function clearTokenCache(): void {
  cache = null;
}

export async function getAccessToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + SAFETY_WINDOW_MS) {
    return cache.accessToken;
  }

  const basic = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Spotify token refresh failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cache.accessToken;
}
