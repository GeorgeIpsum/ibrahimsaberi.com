// Portable SSRF egress guard: classify a destination IP as blocked (internal /
// loopback / link-local / metadata) or allowed. Pure — only string math and
// arrays — so it compiles and runs unchanged under Node and Cloudflare Workers.
// DNS resolution is runtime-specific and lives in node/resolve.ts; this module
// only decides, given a literal IP, whether it is allowed to be dialed.

import { CloseReason } from "./protocol";

export interface ParsedIp {
  family: 4 | 6;
  /** 4 bytes for IPv4, 16 bytes for IPv6. */
  bytes: number[];
}

/** Parse a literal IPv4 or IPv6 address to its bytes. `null` for hostnames. */
export function parseIp(host: string): ParsedIp | null {
  const v4 = parseIpv4(host);
  if (v4) return { family: 4, bytes: v4 };
  const v6 = parseIpv6(host);
  if (v6) return { family: 6, bytes: v6 };
  return null;
}

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    bytes.push(n);
  }
  return bytes;
}

function parseIpv6(host: string): number[] | null {
  let s = host;
  // Strip zone id (fe80::1%eth0).
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  if (!s.includes(":")) return null;

  // Handle an embedded IPv4 tail (e.g. ::ffff:127.0.0.1).
  const lastColon = s.lastIndexOf(":");
  const tail = s.slice(lastColon + 1);
  if (tail.includes(".")) {
    const tailBytes = parseIpv4(tail);
    if (!tailBytes) return null;
    // Replace the dotted quad with two hextets.
    s =
      s.slice(0, lastColon + 1) +
      `${((tailBytes[0]! << 8) | tailBytes[1]!).toString(16)}:${(
        (tailBytes[2]! << 8) |
        tailBytes[3]!
      ).toString(16)}`;
  }

  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rear = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const explicit = head.length + rear.length;
  if (halves.length === 1) {
    if (explicit !== 8) return null;
  } else if (explicit > 7) {
    return null;
  }
  const zeros = 8 - explicit;
  const groups = [
    ...head,
    ...Array(halves.length === 2 ? zeros : 0).fill("0"),
    ...rear,
  ];
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    const n = Number.parseInt(g, 16);
    bytes.push((n >> 8) & 0xff, n & 0xff);
  }
  return bytes;
}

function v4Blocked(b: number[]): boolean {
  const a = b[0]!;
  const second = b[1]!;
  if (a === 127) return true; // loopback 127/8
  if (a === 10) return true; // RFC1918 10/8
  if (a === 0) return true; // 0.0.0.0/8 "this host"
  if (a === 169 && second === 254) return true; // link-local + metadata 169.254/16
  if (a === 172 && second >= 16 && second <= 31) return true; // 172.16/12
  if (a === 192 && second === 168) return true; // 192.168/16
  return false;
}

function v6Blocked(b: number[]): boolean {
  // ::1 loopback and :: unspecified
  const allZeroButLast = b.slice(0, 15).every((x) => x === 0);
  if (allZeroButLast && (b[15] === 1 || b[15] === 0)) return true;
  // IPv4-mapped ::ffff:a.b.c.d — classify the embedded v4.
  const isMapped =
    b.slice(0, 10).every((x) => x === 0) && b[10] === 0xff && b[11] === 0xff;
  if (isMapped) return v4Blocked(b.slice(12));
  // fe80::/10 link-local
  if (b[0] === 0xfe && (b[1]! & 0xc0) === 0x80) return true;
  // fc00::/7 unique-local
  if ((b[0]! & 0xfe) === 0xfc) return true;
  return false;
}

/** `"blocked"` | `"allowed"` for a literal IP; `"not-an-ip"` for a hostname. */
export function classifyIp(host: string): "allowed" | "blocked" | "not-an-ip" {
  const parsed = parseIp(host);
  if (!parsed) return "not-an-ip";
  const blocked =
    parsed.family === 4 ? v4Blocked(parsed.bytes) : v6Blocked(parsed.bytes);
  return blocked ? "blocked" : "allowed";
}

/** True only when `host` is a literal IP in a blocked range. */
export function isBlockedIp(host: string): boolean {
  return classifyIp(host) === "blocked";
}

/** Thrown by a dialer when a destination is refused by the egress guard. */
export class EgressBlockedError extends Error {
  readonly wispCloseReason = CloseReason.BLOCKED;
  constructor(message = "destination blocked by egress guard") {
    super(message);
    this.name = "EgressBlockedError";
  }
}
