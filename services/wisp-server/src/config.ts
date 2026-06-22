// Resolve config from an env-like object. Node passes process.env; the Worker
// passes its `env` binding. Pure (no runtime globals) so it's shared by both.

export interface WispConfig {
  port: number;
  /** Shared secret; if set, clients must present it (?token= or subprotocol). */
  token?: string;
  /** Allow-list of Origin headers; if undefined, any origin is allowed. */
  allowedOrigins?: string[];
  /** Per-stream flow-control window, in DATA packets. */
  bufferSize: number;
  /** Max concurrent streams per WebSocket connection. */
  maxStreams: number;
}

type Env = Record<string, string | undefined>;

function int(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function resolveConfig(env: Env = {}): WispConfig {
  const origins = env.ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    port: int(env.PORT, 6001),
    token: env.WISP_TOKEN || undefined,
    allowedOrigins: origins && origins.length > 0 ? origins : undefined,
    bufferSize: int(env.WISP_BUFFER_SIZE, 128),
    maxStreams: int(env.WISP_MAX_STREAMS, 512),
  };
}
