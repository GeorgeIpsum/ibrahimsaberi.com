import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

// `connection()` requires a Next request scope that doesn't exist in unit
// tests; stub just that export and keep the real NextRequest/NextResponse.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, connection: vi.fn(async () => {}) };
});

const { GET: pingGET } = await import("../src/app/api/net/ping/route");
const { GET: downGET } = await import("../src/app/api/net/down/route");

describe("GET /api/net/ping", () => {
  it("returns 204 with no-store and an empty body", async () => {
    const res = await pingGET();
    expect(res.status).toBe(204);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.body).toBeNull();
  });
});

describe("GET /api/net/down", () => {
  it("serves incompressible octet-stream with no-transform", async () => {
    const req = new NextRequest("http://localhost/api/net/down?bytes=2048");
    const res = await downGET(req);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("cache-control")).toContain("no-transform");
  });

  it("emits exactly the requested byte cap, then closes", async () => {
    const req = new NextRequest("http://localhost/api/net/down?bytes=600000");
    const res = await downGET(req);
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBe(600000);
  });

  it("emits a payload smaller than one chunk when the cap is tiny", async () => {
    const req = new NextRequest("http://localhost/api/net/down?bytes=1500");
    const res = await downGET(req);
    const body = await res.arrayBuffer();
    expect(body.byteLength).toBe(1500);
  });
});
