import { describe, expect, it } from "vitest";
import { FFMPEG_CORE_VERSION, resolveFfmpegCore } from "./config";

describe("resolveFfmpegCore", () => {
  it("defaults to the jsDelivr core esm dir for the pinned version", () => {
    const r = resolveFfmpegCore();
    expect(r.coreURL).toBe(
      `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.js`,
    );
    expect(r.wasmURL).toMatch(/ffmpeg-core\.wasm$/);
    expect(r.classWorkerURL).toContain("@ffmpeg/ffmpeg@");
  });

  it("honors a base override", () => {
    const r = resolveFfmpegCore({ ffmpegCoreBaseURL: "https://x/core" });
    expect(r.coreURL).toBe("https://x/core/ffmpeg-core.js");
  });
});
