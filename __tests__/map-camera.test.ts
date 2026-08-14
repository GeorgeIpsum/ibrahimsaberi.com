import { describe, expect, it } from "vitest";
import {
  AUTO_ROTATE_DEG_PER_SEC,
  autoRotateSpeed,
  bearingAfterDrag,
  DRAG_DEG_PER_PX,
  normalizeBearing,
  RESUME_RAMP_MS,
} from "@/app/(root)/now/map-camera";

describe("normalizeBearing", () => {
  it("passes through values already in [0, 360)", () => {
    expect(normalizeBearing(0)).toBe(0);
    expect(normalizeBearing(359.5)).toBe(359.5);
  });

  it("wraps values >= 360", () => {
    expect(normalizeBearing(360)).toBe(0);
    expect(normalizeBearing(370)).toBe(10);
    expect(normalizeBearing(725)).toBe(5);
  });

  it("wraps negative values", () => {
    expect(normalizeBearing(-10)).toBe(350);
    expect(normalizeBearing(-720)).toBe(0);
  });
});

describe("bearingAfterDrag", () => {
  it("dragging right (positive dx) decreases bearing", () => {
    expect(bearingAfterDrag(180, 10)).toBeCloseTo(180 - 10 * DRAG_DEG_PER_PX);
  });

  it("dragging left (negative dx) increases bearing", () => {
    expect(bearingAfterDrag(180, -20)).toBeCloseTo(180 + 20 * DRAG_DEG_PER_PX);
  });

  it("wraps around 0/360", () => {
    expect(bearingAfterDrag(0, 10)).toBeCloseTo(360 - 10 * DRAG_DEG_PER_PX);
  });
});

describe("autoRotateSpeed", () => {
  it("is 0 at or before the resume instant", () => {
    expect(autoRotateSpeed(0)).toBe(0);
    expect(autoRotateSpeed(-500)).toBe(0);
  });

  it("reaches full speed at the end of the ramp and stays there", () => {
    expect(autoRotateSpeed(RESUME_RAMP_MS)).toBe(AUTO_ROTATE_DEG_PER_SEC);
    expect(autoRotateSpeed(RESUME_RAMP_MS * 10)).toBe(AUTO_ROTATE_DEG_PER_SEC);
  });

  it("ramps up monotonically in between", () => {
    const quarter = autoRotateSpeed(RESUME_RAMP_MS * 0.25);
    const half = autoRotateSpeed(RESUME_RAMP_MS * 0.5);
    const threeQuarter = autoRotateSpeed(RESUME_RAMP_MS * 0.75);
    expect(quarter).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(quarter);
    expect(threeQuarter).toBeGreaterThan(half);
    expect(threeQuarter).toBeLessThan(AUTO_ROTATE_DEG_PER_SEC);
  });
});
