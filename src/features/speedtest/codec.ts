// Round-trips a speedtest result through the `?result=` search param as
// base64url(JSON). Isomorphic (btoa/atob are global in both the browser and
// Node) so the page can decode server-side and the client can encode share
// links. Decode is defensive: any malformed/hostile param yields null, never a
// throw.

export interface SpeedtestResult {
  downMbps: number;
  upMbps: number;
  pingMs: number;
  /** Epoch ms of when the test finished. */
  measuredAt: number;
  /** Vercel compute region the test ran against (e.g. "fra1"), when known. */
  region: string | null;
  /** Requester's geo-IP label (e.g. "Toronto, ON, CA"), when known. */
  location: string | null;
}

interface WireResult {
  v: 1;
  d: number;
  u: number;
  p: number;
  t: number;
  r?: string;
  l?: string;
}

// btoa/atob only speak Latin-1, and location labels can carry any Unicode
// (geo-IP city names), so round-trip through UTF-8 bytes.
const toBase64Url = (s: string): string => {
  let binary = "";
  for (const byte of new TextEncoder().encode(s)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
};

const fromBase64Url = (s: string): string => {
  const binary = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
  );
};

/** Sane speedtest bounds; anything outside is a corrupt/forged param. */
const isPlausible = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n < 1_000_000;

/** Region codes are short and alphanumeric; anything else doesn't round-trip.
 * The digit tail is bounded so a forged param can't smuggle a multi-KB
 * "region" through validation. */
const isPlausibleRegion = (r: unknown): r is string =>
  typeof r === "string" && /^[a-z]{3,4}\d{0,3}$/.test(r);

/** Location is display-only free text; just bound it and reject control and
 * other invisible Unicode category-C characters. */
const isPlausibleLocation = (l: unknown): l is string =>
  typeof l === "string" && /^\P{C}{1,80}$/u.test(l);

export const encodeResult = (result: SpeedtestResult): string => {
  const wire: WireResult = {
    v: 1,
    d: result.downMbps,
    u: result.upMbps,
    p: result.pingMs,
    t: result.measuredAt,
    ...(result.region !== null && { r: result.region }),
    ...(result.location !== null && { l: result.location }),
  };
  return toBase64Url(JSON.stringify(wire));
};

export const decodeResult = (
  raw: string | undefined,
): SpeedtestResult | null => {
  if (!raw) return null;
  try {
    const wire = JSON.parse(fromBase64Url(raw)) as Partial<WireResult>;
    if (wire.v !== 1) return null;
    if (!isPlausible(wire.d) || !isPlausible(wire.u) || !isPlausible(wire.p)) {
      return null;
    }
    if (typeof wire.t !== "number" || !Number.isFinite(wire.t) || wire.t < 0) {
      return null;
    }
    return {
      downMbps: wire.d,
      upMbps: wire.u,
      pingMs: wire.p,
      measuredAt: wire.t,
      region: isPlausibleRegion(wire.r) ? wire.r : null,
      location: isPlausibleLocation(wire.l) ? wire.l : null,
    };
  } catch {
    return null;
  }
};
