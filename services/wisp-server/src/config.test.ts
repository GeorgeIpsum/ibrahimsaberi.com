import { describe, expect, it } from "vitest";
import { resolveConfig } from "./config";

describe("resolveConfig security knobs", () => {
  it("defaults: not production, closed UDP, sane caps", () => {
    const c = resolveConfig({});
    expect(c.isProduction).toBe(false);
    expect(c.allowOpen).toBe(false);
    expect(c.udpEnabled).toBe(false);
    expect(c.maxConnections).toBe(256);
    expect(c.maxConnectionsPerIp).toBe(16);
    expect(c.connectRatePerMin).toBe(120);
    expect(c.idleTimeoutMs).toBe(120000);
    expect(c.maxLifetimeMs).toBe(3600000);
    expect(c.maxPayloadBytes).toBe(1048576);
  });

  it("reads NODE_ENV=production", () => {
    expect(resolveConfig({ NODE_ENV: "production" }).isProduction).toBe(true);
  });

  it("enables UDP and open mode via env", () => {
    const c = resolveConfig({ WISP_UDP_ENABLED: "1", WISP_ALLOW_OPEN: "true" });
    expect(c.udpEnabled).toBe(true);
    expect(c.allowOpen).toBe(true);
  });

  it("overrides numeric caps", () => {
    const c = resolveConfig({
      WISP_MAX_CONNECTIONS: "10",
      WISP_MAX_PAYLOAD: "2048",
    });
    expect(c.maxConnections).toBe(10);
    expect(c.maxPayloadBytes).toBe(2048);
  });
});
