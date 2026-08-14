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
const { POST: upPOST } = await import("../src/app/api/net/up/route");
const { MAX_UPLOAD_BYTES } = await import("../src/utils/network-quality");

describe("GET /api/net/ping", () => {
  it("returns 204 with no-store and an empty body", async () => {
    const res = await pingGET(new NextRequest("http://localhost/api/net/ping"));
    expect(res.status).toBe(204);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.body).toBeNull();
    expect(res.headers.get("x-net-ip-city")).toBeNull();
  });

  it("echoes Vercel geo request headers as x-net-* response headers", async () => {
    const req = new NextRequest("http://localhost/api/net/ping", {
      headers: {
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
        "x-vercel-ip-country-region": "SP",
        "x-vercel-ip-country": "BR",
      },
    });
    const res = await pingGET(req);
    expect(res.headers.get("x-net-ip-city")).toBe("S%C3%A3o%20Paulo");
    expect(res.headers.get("x-net-ip-country-region")).toBe("SP");
    expect(res.headers.get("x-net-ip-country")).toBe("BR");
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

describe("POST /api/net/up", () => {
  const upRequest = (body: Uint8Array | null) =>
    new NextRequest("http://localhost/api/net/up", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/octet-stream" },
    });

  it("drains the body and acks the byte count with no-store", async () => {
    const res = await upPOST(upRequest(new Uint8Array(600_000)));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    await expect(res.json()).resolves.toEqual({ received: 600_000 });
  });

  it("rejects a body over the byte cap with 413", async () => {
    const res = await upPOST(upRequest(new Uint8Array(MAX_UPLOAD_BYTES + 1)));
    expect(res.status).toBe(413);
  });

  it("rejects a missing body with 400", async () => {
    const res = await upPOST(upRequest(null));
    expect(res.status).toBe(400);
  });
});
