import "server-only";
import { revalidateTag } from "next/cache";
import { cache } from "react";
import { getAccessToken } from "./auth";

export type Playlist = {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string | null;
  trackCount: number;
};

type SpotifyImage = {
  url: string;
  width: number | null;
  height: number | null;
};

type SpotifyPlaylistItem = {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: { total: number };
  external_urls: { spotify: string };
  public: boolean | null;
};

type PlaylistsPage = {
  items: SpotifyPlaylistItem[];
  next: string | null;
};

// User ID is immutable per Spotify account; cache it across the whole request
// AND for a day at the fetch layer, so the /me round-trip happens rarely.
const getUserId = cache(async (): Promise<string | null> => {
  try {
    const token = await getAccessToken();
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86_400, tags: ["spotify-user-id"] },
    });
    if (!res.ok) {
      console.error(
        `[spotify] /me returned ${res.status}: ${await res.text()}`,
      );
      if (res.status === 404) {
        revalidateTag("spotify-user-id", "max");
      }
      return null;
    }
    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (e) {
    console.error("[spotify] failed to fetch current user id:", e);
    return null;
  }
});

export const getMyPlaylists = cache(
  async (publicPlaylists = false): Promise<Playlist[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    let token: string;
    try {
      token = await getAccessToken();
    } catch (e) {
      console.error("[spotify] failed to obtain access token:", e);
      return [];
    }

    const collected: SpotifyPlaylistItem[] = [];
    let url: string | null =
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`;

    while (url) {
      const res: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        console.error(
          `[spotify] playlists fetch returned ${res.status}: ${await res.text()}`,
        );
        break;
      }

      const page = (await res.json()) as PlaylistsPage;
      collected.push(...page.items);
      url = page.next;
    }

    // Authenticated requests against your own /users/{id}/playlists endpoint
    // can include collaborative/private playlists too. Filter to public only.
    return collected
      .filter((p) => publicPlaylists || p.public !== false)
      .map(toPlaylist);
  },
);

function toPlaylist(item: SpotifyPlaylistItem): Playlist {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    url: item.external_urls.spotify,
    imageUrl: pickImage(item.images),
    trackCount: item.tracks.total,
  };
}

function pickImage(images: SpotifyImage[]): string | null {
  if (!images.length) return null;
  const mid = images.find(
    (i) => i.width != null && i.width >= 200 && i.width <= 400,
  );
  return (mid ?? images[images.length - 1] ?? images[0]).url;
}
