import dns from "node:dns/promises";
import { classifyIp, EgressBlockedError } from "../egress-guard";

export type LookupFn = (host: string) => Promise<string[]>;

const defaultLookup: LookupFn = async (host) => {
  const records = await dns.lookup(host, { all: true, verbatim: true });
  return records.map((r) => r.address);
};

/**
 * Resolve `hostname` and return one validated IP safe to dial. Throws
 * EgressBlockedError if the target is a literal internal IP, resolves to any
 * internal IP (DNS-rebinding defense), or resolves to nothing. The returned IP
 * is what the caller must connect() to — never re-resolve the hostname.
 */
export async function resolveAndGuard(
  hostname: string,
  lookup: LookupFn = defaultLookup,
): Promise<string> {
  const literal = classifyIp(hostname);
  if (literal === "blocked") {
    throw new EgressBlockedError(`blocked literal address: ${hostname}`);
  }
  if (literal === "allowed") return hostname; // public literal IP

  const addresses = await lookup(hostname);
  if (addresses.length === 0) {
    throw new EgressBlockedError(`no addresses resolved for ${hostname}`);
  }
  for (const addr of addresses) {
    if (classifyIp(addr) === "blocked") {
      throw new EgressBlockedError(
        `${hostname} resolves to internal address ${addr}`,
      );
    }
  }
  return addresses[0]!; // pin to the first validated address
}
