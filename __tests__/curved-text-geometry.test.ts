import { describe, expect, it } from "vitest";
import {
  bendAngleDeg,
  type LetterGeometry,
  letterOpacity,
  letterTransform,
  MIN_BEND,
  REAR_OPACITY,
  ringAngleDeg,
  tiltTransform,
} from "@/components/text/curved-text-geometry";

const geom = (
  flatX: number,
  ringAngle: number,
  radius = 100,
  flatY = 0,
): LetterGeometry => ({
  flatX,
  flatY,
  ringAngleDeg: ringAngle,
  radius,
});

describe("ringAngleDeg", () => {
  it("spaces letters equally, centered on zero", () => {
    expect(ringAngleDeg(0, 4)).toBeCloseTo(-135);
    expect(ringAngleDeg(1, 4)).toBeCloseTo(-45);
    expect(ringAngleDeg(2, 4)).toBeCloseTo(45);
    expect(ringAngleDeg(3, 4)).toBeCloseTo(135);
  });

  it("puts the middle letter of an odd count at zero", () => {
    expect(ringAngleDeg(1, 3)).toBeCloseTo(0);
  });

  it("centers a single letter at zero", () => {
    expect(ringAngleDeg(0, 1)).toBeCloseTo(0);
  });
});

describe("bendAngleDeg", () => {
  it("reaches the exact ring angle at full bend (p = 1)", () => {
    expect(bendAngleDeg(1, geom(50, 72))).toBeCloseTo(72);
  });

  it("holds the ring angle through the tip-over phase (p > 1)", () => {
    expect(bendAngleDeg(1.5, geom(50, 72))).toBeCloseTo(72);
    expect(bendAngleDeg(2, geom(50, 72))).toBeCloseTo(72);
  });

  it("places letters at their natural flat offsets when p = 0", () => {
    // World x on the bend circle is R·sin(φ) with R = radius / t.
    const g = geom(50, 85.94); // ~1.5 rad ring angle — worst case for leakage
    const phi = (bendAngleDeg(0, g) * Math.PI) / 180;
    const x = (g.radius / MIN_BEND) * Math.sin(phi);
    expect(Math.abs(x - g.flatX)).toBeLessThan(0.25);
  });
});

describe("letterTransform", () => {
  it("keeps letters unflipped through the bend phase", () => {
    expect(letterTransform(1, geom(0, 0))).toContain("rotateX(0deg)");
  });

  it("counter-flips letters -90° at full tip-over", () => {
    expect(letterTransform(2, geom(0, 0))).toContain("rotateX(-90deg)");
  });

  it("collapses to the ring radius at full bend", () => {
    const transform = letterTransform(1, geom(0, 90, 100));
    expect(transform).toContain("translateZ(0px)"); // radius − bendRadius = 0
    expect(transform).toContain("translateZ(100px)");
  });

  it("centers the glyph box before the 3D chain", () => {
    expect(letterTransform(0, geom(0, 0))).toMatch(/^translate\(-50%, -50%\)/);
  });

  it("keeps the wrapped-line y offset in the flat phase", () => {
    expect(letterTransform(0, geom(0, 0, 100, 32))).toContain(
      "translateY(32px)",
    );
  });

  it("collapses line offsets into the single band at full bend", () => {
    expect(letterTransform(1, geom(0, 0, 100, 32))).toContain(
      "translateY(0px)",
    );
    expect(letterTransform(2, geom(0, 0, 100, 32))).toContain(
      "translateY(0px)",
    );
  });
});

describe("letterOpacity", () => {
  it("is fully opaque in the flat phase", () => {
    expect(letterOpacity(0, 0, geom(50, 120))).toBeCloseTo(1, 1);
  });

  it("dims a rear-facing letter to REAR_OPACITY at full cylinder", () => {
    expect(letterOpacity(1, 180, geom(0, 0))).toBeCloseTo(REAR_OPACITY);
  });

  it("keeps a front-facing letter fully opaque at full cylinder", () => {
    expect(letterOpacity(1, 0, geom(0, 0))).toBeCloseTo(1);
  });

  it("returns to fully opaque in the ring phase", () => {
    expect(letterOpacity(2, 180, geom(0, 0))).toBeCloseTo(1);
  });
});

describe("tiltTransform", () => {
  it("compensates the flat span back to z = 0", () => {
    expect(tiltTransform(0, 100)).toBe("rotateX(0deg) translateZ(-100px)");
  });

  it("centers the cylinder on the tilt pivot", () => {
    expect(tiltTransform(1, 100)).toBe("rotateX(0deg) translateZ(0px)");
  });

  it("tips fully over at p = 2", () => {
    expect(tiltTransform(2, 100)).toBe("rotateX(90deg) translateZ(0px)");
  });
});
