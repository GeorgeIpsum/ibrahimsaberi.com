import { describe, expect, it } from "vitest";
import { checkAuth, constantTimeEqual, isAuthConfigured } from "./auth";
import { resolveConfig } from "./config";

const base = resolveConfig({});

describe("constantTimeEqual", () => {
  it("is true for equal strings", () => {
    expect(constantTimeEqual("s3cret", "s3cret")).toBe(true);
  });
  it("is false for different strings of equal length", () => {
    expect(constantTimeEqual("s3cret", "s3crXt")).toBe(false);
  });
  it("is false for different lengths", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
  it("is true for two empty strings", () => {
    expect(constantTimeEqual("", "")).toBe(true);
  });
});

describe("isAuthConfigured", () => {
  it("false when neither token nor origins set", () => {
    expect(isAuthConfigured(base)).toBe(false);
  });
  it("true when a token is set", () => {
    expect(isAuthConfigured({ ...base, token: "x" })).toBe(true);
  });
  it("true when origins are set", () => {
    expect(isAuthConfigured({ ...base, allowedOrigins: ["https://a"] })).toBe(
      true,
    );
  });
});

describe("checkAuth token", () => {
  it("accepts the correct token", () => {
    const r = checkAuth(
      { ...base, token: "good" },
      { origin: null, token: "good" },
    );
    expect(r.ok).toBe(true);
  });
  it("rejects a wrong token", () => {
    const r = checkAuth(
      { ...base, token: "good" },
      { origin: null, token: "bad" },
    );
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });
  it("rejects a missing token", () => {
    const r = checkAuth(
      { ...base, token: "good" },
      { origin: null, token: null },
    );
    expect(r.ok).toBe(false);
  });
});
