import { describe, expect, it, vi } from "vitest";
import {
  type NowPlaying,
  withLiveProgress,
} from "../src/services/spotify/now-playing";

// `auth.ts` validates Spotify env vars at import time; stub it out so the
// pure helpers in now-playing.ts can be imported without credentials.
vi.mock("../src/services/spotify/auth", () => ({
  getAccessToken: vi.fn(),
  clearTokenCache: vi.fn(),
}));

const track: NowPlaying = {
  isPlaying: true,
  title: "Test Track",
  artist: "Test Artist",
  album: "Test Album",
  albumArt: null,
  url: "https://open.spotify.com/track/x",
  progressMs: 60_000,
  durationMs: 180_000,
  fetchedAt: 1_000_000,
};

describe("withLiveProgress", () => {
  it("advances progress by the snapshot's age", () => {
    const live = withLiveProgress(track, track.fetchedAt + 8_000);
    expect(live.progressMs).toBe(68_000);
  });

  it("clamps progress at the track duration", () => {
    const live = withLiveProgress(track, track.fetchedAt + 500_000);
    expect(live.progressMs).toBe(track.durationMs);
  });

  it("does not advance paused tracks", () => {
    const paused = { ...track, isPlaying: false };
    const live = withLiveProgress(paused, track.fetchedAt + 8_000);
    expect(live.progressMs).toBe(track.progressMs);
  });

  it("never moves progress backwards on clock skew", () => {
    const live = withLiveProgress(track, track.fetchedAt - 5_000);
    expect(live.progressMs).toBe(track.progressMs);
  });
});
