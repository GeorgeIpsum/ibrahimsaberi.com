import { describe, expect, it } from "vitest";
import {
  type QualitySources,
  selectAudioQuality,
} from "@/features/audio/select-quality";

const sources = {
  hq: "/audio/hq.mp3",
  rq: "/audio/rq.mp3",
  lq: "/audio/lq.mp3",
} satisfies QualitySources;

describe("selectAudioQuality", () => {
  it("uses high quality on a good connection", () => {
    expect(selectAudioQuality(sources, "good")).toBe(sources.hq);
  });

  it("uses regular quality on a slow connection", () => {
    expect(selectAudioQuality(sources, "slow")).toBe(sources.rq);
  });

  it("uses low quality when offline", () => {
    expect(selectAudioQuality(sources, "offline")).toBe(sources.lq);
  });

  it("falls back to regular quality while still checking", () => {
    expect(selectAudioQuality(sources, "checking")).toBe(sources.rq);
  });
});
