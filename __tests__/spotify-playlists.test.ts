import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken } from "../src/services/spotify/auth";
import { getMyPlaylists } from "../src/services/spotify/playlists";

// Mock the auth module wholesale to avoid loading `@/env` (which validates
// SPOTIFY_* vars at import time).
vi.mock("../src/services/spotify/auth", () => ({
  getAccessToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// React's `cache()` memoizes per request; make it a passthrough so each call
// re-runs against the mocked fetch.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: ((fn: unknown) => fn) as typeof actual.cache };
});

vi.spyOn(console, "error").mockImplementation(() => {});

type FakeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function jsonResponse(status: number, body: unknown): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => "",
  };
}

type ImageLike = { url: string; width: number | null; height: number | null };

function playlistItem(
  over: Partial<{
    id: string;
    description: string | null;
    images: ImageLike[];
    isPublic: boolean | null;
  }> = {},
) {
  return {
    id: over.id ?? "p1",
    name: "My Playlist",
    description: over.description === undefined ? "desc" : over.description,
    images: over.images ?? [
      { url: "https://img/cover", width: 300, height: 300 },
    ],
    tracks: { total: 5 },
    external_urls: { spotify: "https://open.spotify.com/playlist/p1" },
    public: over.isPublic === undefined ? true : over.isPublic,
  };
}

const fetchMock = vi.fn<(input: unknown) => Promise<FakeResponse>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(getAccessToken).mockReset().mockResolvedValue("tok");
  vi.mocked(revalidateTag).mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getMyPlaylists", () => {
  it("maps a single page of playlists", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/me")) return jsonResponse(200, { id: "user-1" });
      if (url.includes("/playlists")) {
        return jsonResponse(200, { items: [playlistItem()], next: null });
      }
      throw new Error(`unexpected url ${url}`);
    });

    expect(await getMyPlaylists()).toEqual([
      {
        id: "p1",
        name: "My Playlist",
        description: "desc",
        url: "https://open.spotify.com/playlist/p1",
        imageUrl: "https://img/cover",
        trackCount: 5,
      },
    ]);
  });

  it("follows the next cursor across pages", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/me")) return jsonResponse(200, { id: "u" });
      if (url.includes("page-2")) {
        return jsonResponse(200, {
          items: [playlistItem({ id: "p2" })],
          next: null,
        });
      }
      if (url.includes("/playlists")) {
        return jsonResponse(200, {
          items: [playlistItem({ id: "p1" })],
          next: "https://api.spotify.com/v1/page-2",
        });
      }
      throw new Error(`unexpected url ${url}`);
    });

    const result = await getMyPlaylists();
    expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("excludes private playlists by default", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/me")) return jsonResponse(200, { id: "u" });
      return jsonResponse(200, {
        items: [
          playlistItem({ id: "pub", isPublic: true }),
          playlistItem({ id: "priv", isPublic: false }),
          playlistItem({ id: "unset", isPublic: null }),
        ],
        next: null,
      });
    });

    const result = await getMyPlaylists();
    expect(result.map((p) => p.id)).toEqual(["pub", "unset"]);
  });

  it("includes private playlists when publicPlaylists is set", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/me")) return jsonResponse(200, { id: "u" });
      return jsonResponse(200, {
        items: [
          playlistItem({ id: "pub", isPublic: true }),
          playlistItem({ id: "priv", isPublic: false }),
        ],
        next: null,
      });
    });

    const result = await getMyPlaylists(true);
    expect(result.map((p) => p.id)).toEqual(["pub", "priv"]);
  });

  it("returns an empty list when the user id cannot be resolved", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    expect(await getMyPlaylists()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("revalidates the user-id tag on a 404 from /me", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, {}));
    expect(await getMyPlaylists()).toEqual([]);
    expect(revalidateTag).toHaveBeenCalledWith("spotify-user-id", "max");
  });

  it("breaks pagination on a non-OK page, keeping what was collected", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/me")) return jsonResponse(200, { id: "u" });
      if (url.includes("page-2")) return jsonResponse(500, {});
      if (url.includes("/playlists")) {
        return jsonResponse(200, {
          items: [playlistItem({ id: "p1" })],
          next: "https://api.spotify.com/v1/page-2",
        });
      }
      throw new Error(`unexpected url ${url}`);
    });

    const result = await getMyPlaylists();
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });
});
