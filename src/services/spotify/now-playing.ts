import "server-only";
import { clearTokenCache, getAccessToken } from "./auth";

export type NowPlaying = {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
  progressMs: number;
  durationMs: number;
  /**
   * Epoch ms when Spotify generated this snapshot. Taken from the response
   * `Date` header so it stays coherent with `progressMs` even when the fetch
   * is served from Next's revalidate cache.
   */
  fetchedAt: number;
};

type SpotifyImage = { url: string; width: number; height: number };
type SpotifyArtist = { name: string };
type SpotifyTrack = {
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: { name: string; images: SpotifyImage[] };
  external_urls: { spotify: string };
};
type CurrentlyPlayingResponse = {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  currently_playing_type: string;
};

export async function getNowPlaying(): Promise<NowPlaying | null> {
  return fetchNowPlaying(false);
}

async function fetchNowPlaying(isRetry: boolean): Promise<NowPlaying | null> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    console.warn("[spotify] failed to obtain access token:", e);
    return null;
  }

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 10 },
    },
  );

  if (res.status === 204) return null;

  // Token expired mid-flight — drop the cached token and retry once with a
  // fresh one. Self-heals instead of surfacing a 401 to the dev overlay.
  if (res.status === 401 && !isRetry) {
    clearTokenCache();
    return fetchNowPlaying(true);
  }

  if (!res.ok) {
    // console.warn (not console.error) so Next's dev overlay doesn't treat a
    // recoverable upstream hiccup as a page-breaking error.
    console.warn(`[spotify] currently-playing returned ${res.status}`);
    return null;
  }

  const data = (await res.json()) as CurrentlyPlayingResponse;
  if (
    !data?.item ||
    data.currently_playing_type !== "track" // skip podcasts / episodes
  ) {
    return null;
  }

  const item = data.item;
  const albumArt = pickAlbumArt(item.album.images);

  return {
    isPlaying: data.is_playing,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    album: item.album.name,
    albumArt,
    url: item.external_urls.spotify,
    progressMs: data.progress_ms,
    durationMs: item.duration_ms,
    fetchedAt: Date.parse(res.headers.get("date") ?? "") || Date.now(),
  };
}

/**
 * Returns the track with `progressMs` advanced to `now`, compensating for
 * time the snapshot spent in the fetch cache. Paused tracks don't advance.
 */
export function withLiveProgress(track: NowPlaying, now: number): NowPlaying {
  if (!track.isPlaying) return track;
  const elapsed = Math.max(0, now - track.fetchedAt);
  return {
    ...track,
    progressMs: Math.min(track.progressMs + elapsed, track.durationMs),
  };
}

function pickAlbumArt(images: SpotifyImage[]): string | null {
  if (!images.length) return null;
  const mid = images.find((i) => i.width >= 200 && i.width <= 400);
  return (mid ?? images[images.length - 1] ?? images[0]).url;
}
