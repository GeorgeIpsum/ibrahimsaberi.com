import type { WispConfig } from "./config";

// Optional hardening. The Wisp endpoint is an open TCP proxy, so a public
// deployment SHOULD set WISP_TOKEN and/or ALLOWED_ORIGINS. With neither set the
// server is open (handy for local testing).

export interface AuthRequest {
  origin: string | null;
  token: string | null;
}

export interface AuthResult {
  ok: boolean;
  status: number;
  message: string;
}

export function checkAuth(cfg: WispConfig, req: AuthRequest): AuthResult {
  if (cfg.allowedOrigins) {
    if (!req.origin || !cfg.allowedOrigins.includes(req.origin)) {
      return { ok: false, status: 403, message: "origin not allowed" };
    }
  }
  if (cfg.token && req.token !== cfg.token) {
    return { ok: false, status: 401, message: "invalid or missing token" };
  }
  return { ok: true, status: 101, message: "ok" };
}
