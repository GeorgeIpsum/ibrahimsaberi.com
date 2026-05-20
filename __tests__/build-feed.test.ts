import { describe, expect, it } from "vitest";
import { originFromHeaders } from "../src/services/basin/build-feed";

function makeHeaders(
  init: Record<string, string>,
): Parameters<typeof originFromHeaders>[0] {
  return new Headers(init) as unknown as Parameters<
    typeof originFromHeaders
  >[0];
}

describe("originFromHeaders", () => {
  it("falls back to the production host over https when host is absent", () => {
    expect(originFromHeaders(makeHeaders({}))).toBe(
      "https://ibrahimsaberi.com",
    );
  });

  it("uses http for a localhost host", () => {
    expect(originFromHeaders(makeHeaders({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("uses https for a non-localhost host", () => {
    expect(originFromHeaders(makeHeaders({ host: "example.com" }))).toBe(
      "https://example.com",
    );
  });

  it("honors an explicit x-forwarded-proto over the host-based guess", () => {
    expect(
      originFromHeaders(
        makeHeaders({ host: "localhost:3000", "x-forwarded-proto": "https" }),
      ),
    ).toBe("https://localhost:3000");
  });

  it("honors x-forwarded-proto=http for a non-localhost host", () => {
    expect(
      originFromHeaders(
        makeHeaders({ host: "example.com", "x-forwarded-proto": "http" }),
      ),
    ).toBe("http://example.com");
  });
});
