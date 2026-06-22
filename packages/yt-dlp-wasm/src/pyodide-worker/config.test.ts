import { describe, expect, it } from "vitest";
import {
  PYODIDE_VERSION,
  resolvePyodideIndexURL,
  resolveYtDlpInstall,
} from "./config";

describe("resolvePyodideIndexURL", () => {
  it("defaults to the jsDelivr CDN for the pinned version", () => {
    expect(resolvePyodideIndexURL()).toBe(
      `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
    );
  });

  it("honors an override and guarantees a trailing slash", () => {
    expect(resolvePyodideIndexURL({ pyodideIndexURL: "https://x/y" })).toBe(
      "https://x/y/",
    );
    expect(resolvePyodideIndexURL({ pyodideIndexURL: "https://x/y/" })).toBe(
      "https://x/y/",
    );
  });
});

describe("resolveYtDlpInstall", () => {
  it("defaults to micropip yt-dlp", () => {
    expect(resolveYtDlpInstall()).toEqual({ kind: "micropip", spec: "yt-dlp" });
    expect(resolveYtDlpInstall("micropip")).toEqual({
      kind: "micropip",
      spec: "yt-dlp",
    });
  });

  it("supports a URL source", () => {
    expect(resolveYtDlpInstall({ url: "https://r2/yt_dlp.whl" })).toEqual({
      kind: "url",
      url: "https://r2/yt_dlp.whl",
    });
  });
});
