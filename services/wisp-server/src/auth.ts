import type { WispConfig } from "./config";

// Optional hardening. The Wisp endpoint is an open TCP proxy, so a public
// deployment SHOULD set WISP_TOKEN and/or ALLOWED_ORIGINS. With neither set the
// server is open (handy for local testing; production refuses to boot open).

export interface AuthRequest {
  origin: string | null;
  token: string | null;
}

export interface AuthResult {
  ok: boolean;
  status: number;
  message: string;
}

/**
 * Length-safe constant-time string comparison. Portable (no node:crypto) so it
 * runs on the Worker too. Compares over the max length and folds the length
 * difference into the result so it never returns early and does not leak the
 * secret's length via timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** True iff at least one auth mechanism is configured. */
export function isAuthConfigured(cfg: WispConfig): boolean {
  return Boolean(cfg.token) || Boolean(cfg.allowedOrigins?.length);
}

export function checkAuth(cfg: WispConfig, req: AuthRequest): AuthResult {
  if (cfg.allowedOrigins) {
    if (!req.origin || !cfg.allowedOrigins.includes(req.origin)) {
      return { ok: false, status: 403, message: "origin not allowed" };
    }
  }
  if (cfg.token) {
    if (!req.token || !constantTimeEqual(req.token, cfg.token)) {
      return { ok: false, status: 401, message: "invalid or missing token" };
    }
  }
  return { ok: true, status: 101, message: "ok" };
}
