// Vercel stamps every response with `x-vercel-id`, a `::`-separated chain of
// region codes ending in the request id (e.g. "fra1::iad1::abc12-...`). The
// first segment is the edge POP that terminated the client's connection —
// i.e. the node the speedtest is actually measuring against. Same-origin
// fetches can read the header directly; locally (next dev) it's absent.

export const parseVercelPop = (id: string | null): string | null => {
  if (!id) return null;
  const first = id.split("::")[0]?.trim().toLowerCase();
  if (!first || !/^[a-z]{3,4}\d*$/.test(first)) return null;
  return first;
};

/** Vercel region/POP codes are IATA-ish airport codes. Best-effort map; an
 * unknown code just displays as-is. */
const REGION_NAMES: Record<string, string> = {
  arn1: "Stockholm",
  bom1: "Mumbai",
  cdg1: "Paris",
  cle1: "Cleveland",
  cpt1: "Cape Town",
  dub1: "Dublin",
  fra1: "Frankfurt",
  gru1: "São Paulo",
  hkg1: "Hong Kong",
  hnd1: "Tokyo",
  iad1: "Washington, D.C.",
  icn1: "Seoul",
  kix1: "Osaka",
  lhr1: "London",
  pdx1: "Portland",
  sfo1: "San Francisco",
  sin1: "Singapore",
  syd1: "Sydney",
};

export const describeVercelRegion = (code: string): string => {
  const name = REGION_NAMES[code];
  return name ? `${name} (${code})` : code;
};

/**
 * Human label from Vercel's geo-IP request headers (echoed by the ping route
 * as x-net-* response headers). City is RFC3986-encoded per Vercel's docs;
 * region is the country subdivision (e.g. "ON"), country is ISO 3166-1
 * alpha-2. Best effort — any subset may be missing.
 */
export const formatUserLocation = ({
  city,
  region,
  country,
}: {
  city: string | null;
  region: string | null;
  country: string | null;
}): string | null => {
  let decodedCity: string | null = null;
  if (city) {
    try {
      decodedCity = decodeURIComponent(city);
    } catch {
      decodedCity = city;
    }
  }
  const parts = [decodedCity, region, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
};
