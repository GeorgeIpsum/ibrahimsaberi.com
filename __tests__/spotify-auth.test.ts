import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearTokenCache, getAccessToken } from "../src/services/spotify/auth";

// `@/env` validates SPOTIFY_* vars at import time; supply dummy values so the
// module under test can load.
vi.mock("@/env", () => ({
  env: {
    SPOTIFY_CLIENT_ID: "test-id",
    SPOTIFY_CLIENT_SECRET: "test-secret",
    SPOTIFY_REFRESH_TOKEN: "test-refresh",
  },
}));

type FakeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function tokenResponse(accessToken: string, expiresIn: number): FakeResponse {
  return {
    ok: true,
    status: 200,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn }),
    text: async () => "",
  };
}

const fetchMock =
  vi.fn<(input: unknown, init?: unknown) => Promise<FakeResponse>>();

beforeEach(() => {
  clearTokenCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAccessToken", () => {
  it("fetches and returns a fresh access token", async () => {
    fetchMock.mockResolvedValue(tokenResponse("tok-1", 3600));
    expect(await getAccessToken()).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached token on a subsequent call", async () => {
    fetchMock.mockResolvedValue(tokenResponse("tok-1", 3600));
    await getAccessToken();
    expect(await getAccessToken()).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches when the cached token is within the safety window of expiry", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse("tok-near-expiry", 30))
      .mockResolvedValueOnce(tokenResponse("tok-2", 3600));
    expect(await getAccessToken()).toBe("tok-near-expiry");
    expect(await getAccessToken()).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refetches after clearTokenCache()", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse("tok-1", 3600))
      .mockResolvedValueOnce(tokenResponse("tok-2", 3600));
    expect(await getAccessToken()).toBe("tok-1");
    clearTokenCache();
    expect(await getAccessToken()).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when the token endpoint responds with an error", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
      text: async () => "invalid_grant",
    });
    await expect(getAccessToken()).rejects.toThrow(
      "Spotify token refresh failed: 400 invalid_grant",
    );
  });

  it("sends a Basic auth header derived from the client credentials", async () => {
    fetchMock.mockResolvedValue(tokenResponse("tok-1", 3600));
    await getAccessToken();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    const expected = Buffer.from("test-id:test-secret").toString("base64");
    expect(headers.Authorization).toBe(`Basic ${expected}`);
  });
});
