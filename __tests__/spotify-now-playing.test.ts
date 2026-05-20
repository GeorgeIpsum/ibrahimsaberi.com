import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearTokenCache, getAccessToken } from "../src/services/spotify/auth";
import { getNowPlaying } from "../src/services/spotify/now-playing";

// Mock the auth module wholesale: this also avoids loading `@/env`, which
// validates SPOTIFY_* vars at import time.
vi.mock("../src/services/spotify/auth", () => ({
  getAccessToken: vi.fn(),
  clearTokenCache: vi.fn(),
}));

vi.spyOn(console, "warn").mockImplementation(() => {});

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

function trackBody() {
  return {
    is_playing: true,
    progress_ms: 12345,
    currently_playing_type: "track",
    item: {
      name: "Song Name",
      duration_ms: 200000,
      artists: [{ name: "Artist A" }, { name: "Artist B" }],
      album: {
        name: "Album Name",
        images: [
          { url: "https://img/big", width: 640, height: 640 },
          { url: "https://img/mid", width: 300, height: 300 },
          { url: "https://img/small", width: 64, height: 64 },
        ],
      },
      external_urls: { spotify: "https://open.spotify.com/track/abc" },
    },
  };
}

const fetchMock = vi.fn<(input: unknown) => Promise<FakeResponse>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.mocked(getAccessToken).mockReset().mockResolvedValue("tok");
  vi.mocked(clearTokenCache).mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getNowPlaying", () => {
  it("returns null when nothing is playing (204)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, null));
    expect(await getNowPlaying()).toBeNull();
  });

  it("maps a currently-playing track", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, trackBody()));
    expect(await getNowPlaying()).toEqual({
      isPlaying: true,
      title: "Song Name",
      artist: "Artist A, Artist B",
      album: "Album Name",
      albumArt: "https://img/mid",
      url: "https://open.spotify.com/track/abc",
      progressMs: 12345,
      durationMs: 200000,
    });
  });

  it("returns null for non-track playback such as podcasts", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        ...trackBody(),
        currently_playing_type: "episode",
      }),
    );
    expect(await getNowPlaying()).toBeNull();
  });

  it("returns null when the response has no item", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ...trackBody(), item: null }),
    );
    expect(await getNowPlaying()).toBeNull();
  });

  it("returns null on an upstream error response", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    expect(await getNowPlaying()).toBeNull();
  });

  it("clears the token and retries once on a 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, trackBody()));
    const result = await getNowPlaying();
    expect(result?.title).toBe("Song Name");
    expect(clearTokenCache).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry indefinitely when the 401 persists", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {}));
    expect(await getNowPlaying()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null without fetching when the token cannot be obtained", async () => {
    vi.mocked(getAccessToken).mockRejectedValue(new Error("no token"));
    expect(await getNowPlaying()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("yields a null albumArt when the track has no album images", async () => {
    const body = trackBody();
    body.item.album.images = [];
    fetchMock.mockResolvedValue(jsonResponse(200, body));
    const result = await getNowPlaying();
    expect(result?.albumArt).toBeNull();
  });

  it("falls back to the last album image when none are mid-sized", async () => {
    const body = trackBody();
    body.item.album.images = [
      { url: "https://img/big", width: 640, height: 640 },
      { url: "https://img/tiny", width: 64, height: 64 },
    ];
    fetchMock.mockResolvedValue(jsonResponse(200, body));
    const result = await getNowPlaying();
    expect(result?.albumArt).toBe("https://img/tiny");
  });
});
