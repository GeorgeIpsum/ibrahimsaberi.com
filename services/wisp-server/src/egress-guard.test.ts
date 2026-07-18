import { describe, expect, it } from "vitest";
import {
  classifyIp,
  EgressBlockedError,
  isBlockedIp,
  parseIp,
} from "./egress-guard";
import { CloseReason } from "./protocol";

describe("parseIp", () => {
  it("parses IPv4 literals to 4 bytes", () => {
    expect(parseIp("10.0.0.1")).toEqual({ family: 4, bytes: [10, 0, 0, 1] });
  });
  it("returns null for hostnames", () => {
    expect(parseIp("example.com")).toBeNull();
  });
  it("parses compressed IPv6", () => {
    expect(parseIp("::1")?.family).toBe(6);
  });
  it("parses IPv4-mapped IPv6", () => {
    expect(parseIp("::ffff:127.0.0.1")?.family).toBe(6);
  });
});

describe("isBlockedIp", () => {
  it.each([
    "127.0.0.1",
    "127.5.5.5",
    "0.0.0.0",
    "10.1.2.3",
    "172.16.0.9",
    "172.31.255.1",
    "192.168.1.1",
    "169.254.169.254",
    "169.254.0.1",
    "::1",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:169.254.169.254",
    "::",
  ])("blocks %s", (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111"])(
    "allows public %s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(false);
    },
  );

  it("does not block a bare hostname (resolution decides)", () => {
    expect(isBlockedIp("example.com")).toBe(false);
  });

  it("blocks 172.15/172.32 boundary correctly", () => {
    expect(isBlockedIp("172.15.0.1")).toBe(false);
    expect(isBlockedIp("172.32.0.1")).toBe(false);
  });
});

describe("classifyIp", () => {
  it("distinguishes not-an-ip from allowed and blocked", () => {
    expect(classifyIp("example.com")).toBe("not-an-ip");
    expect(classifyIp("8.8.8.8")).toBe("allowed");
    expect(classifyIp("127.0.0.1")).toBe("blocked");
  });
});

describe("EgressBlockedError", () => {
  it("carries the BLOCKED wisp close reason", () => {
    expect(new EgressBlockedError("nope").wispCloseReason).toBe(
      CloseReason.BLOCKED,
    );
  });
});
