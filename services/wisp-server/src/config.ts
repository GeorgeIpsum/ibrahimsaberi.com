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
  /** NODE_ENV === "production". Drives fail-closed auth on the Node target. */
  isProduction: boolean;
  /** WISP_ALLOW_OPEN: explicit opt-out of fail-closed (serve open in prod). */
  allowOpen: boolean;
  /** Allow UDP CONNECT streams (relay/amplification risk). Default false. */
  udpEnabled: boolean;
  /** Global concurrent WebSocket connection cap (Node). */
  maxConnections: number;
  /** Per-remote-IP concurrent connection cap (Node). */
  maxConnectionsPerIp: number;
  /** Per-IP new-connection rate limit, connections per minute (Node). */
  connectRatePerMin: number;
  /** Close a connection after this many ms with no inbound message. */
  idleTimeoutMs: number;
  /** Hard cap on a single connection's lifetime, ms. */
  maxLifetimeMs: number;
  /** ws maxPayload: largest single WS frame accepted, bytes. */
  maxPayloadBytes: number;
}

type Env = Record<string, string | undefined>;

function int(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function bool(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
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
    isProduction: env.NODE_ENV === "production",
    allowOpen: bool(env.WISP_ALLOW_OPEN),
    udpEnabled: bool(env.WISP_UDP_ENABLED),
    maxConnections: int(env.WISP_MAX_CONNECTIONS, 256),
    maxConnectionsPerIp: int(env.WISP_MAX_CONNECTIONS_PER_IP, 16),
    connectRatePerMin: int(env.WISP_CONNECT_RATE_PER_MIN, 120),
    idleTimeoutMs: int(env.WISP_IDLE_TIMEOUT_MS, 120000),
    maxLifetimeMs: int(env.WISP_MAX_LIFETIME_MS, 3600000),
    maxPayloadBytes: int(env.WISP_MAX_PAYLOAD, 1048576),
  };
}
