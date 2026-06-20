import { type DecodedFrame, encodeFrame } from "../bridge/frame";
import type { FileStore } from "./file-store";

// libcurl.js (Fetch-compatible WASM curl over a Wisp WebSocket proxy), loaded
// from the CDN at runtime (a computed specifier keeps the bundler from touching
// the Emscripten module). The `libcurl_full.mjs` build inlines the WASM.
const LIBCURL_URL =
  "https://cdn.jsdelivr.net/npm/libcurl.js@0.7.4/libcurl_full.mjs";

type LibcurlFetchOpts = Omit<RequestInit, "body"> & {
  body?: BodyInit | Uint8Array | null;
};

interface Libcurl {
  load_wasm: (url?: string) => Promise<void>;
  set_websocket: (url: string) => void;
  fetch: (
    url: string,
    opts?: LibcurlFetchOpts,
  ) => Promise<Response & { raw_headers?: [string, string][] }>;
}

let libcurlReady: Promise<Libcurl> | undefined;

async function ensureLibcurl(wispUrl: string): Promise<Libcurl> {
  if (!wispUrl) throw new Error("wispUrl is not configured");
  // libcurl is a process-wide singleton, so `wispUrl` is honored only on the
  // first init. That's fine here: it comes from one createYtDlp config. The
  // guard above still rejects an empty wispUrl on the very first call.
  if (!libcurlReady) {
    libcurlReady = (async () => {
      const mod = (await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ LIBCURL_URL
      )) as { libcurl: Libcurl };
      const { libcurl } = mod;
      await libcurl.load_wasm();
      libcurl.set_websocket(wispUrl);
      return libcurl;
    })();
  }
  return libcurlReady;
}

export interface NetSendMeta {
  method: string;
  url: string;
  headers: [string, string][];
  bodyKey?: string;
}

let netSeq = 0;

/** Perform an HTTP request via libcurl.js/Wisp; buffer the body into the store. */
export async function netSend(
  store: FileStore,
  frame: DecodedFrame<NetSendMeta>,
  wispUrl: string,
): Promise<Uint8Array> {
  const { method, url, headers, bodyKey } = frame.meta;
  const libcurl = await ensureLibcurl(wispUrl);
  const body = bodyKey ? store.raw(bodyKey) : undefined;
  const resp = await libcurl.fetch(url, {
    method,
    headers,
    body,
    redirect: "follow",
  });
  const buf = new Uint8Array(await resp.arrayBuffer());
  const responseKey = `__net_${++netSeq}`;
  store.set(responseKey, buf);
  const rawHeaders: [string, string][] = resp.raw_headers ?? [
    ...resp.headers.entries(),
  ];
  return encodeFrame({
    status: resp.status,
    url: resp.url,
    headers: rawHeaders,
    bodyKey: responseKey,
  });
}
