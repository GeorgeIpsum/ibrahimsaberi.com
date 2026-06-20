import { describe, expect, it } from "vitest";
import {
  type AsciiGradientDirection,
  makeArtOpacity,
} from "@/components/backgrounds/ascii-hero";

// A 3x3 block: local cells run lx,ly ∈ {0,1,2}, so fx,fy ∈ {0, 0.5, 1}.
const COLS = 3;
const ROWS = 3;

describe("makeArtOpacity", () => {
  it("defaults missing opacity to fully opaque", () => {
    const op = makeArtOpacity(undefined, COLS, ROWS);
    expect(op(0, 0)).toBe(1);
    expect(op(2, 2)).toBe(1);
  });

  it("treats a number as a clamped constant", () => {
    expect(makeArtOpacity(0.4, COLS, ROWS)(1, 1)).toBe(0.4);
    expect(makeArtOpacity(2, COLS, ROWS)(1, 1)).toBe(1);
    expect(makeArtOpacity(-1, COLS, ROWS)(1, 1)).toBe(0);
  });

  // For each direction: the named start corner/edge is `start`, the opposite
  // end is `end`, and the center sits halfway between.
  const cases: Array<{
    direction: AsciiGradientDirection;
    startCell: [number, number];
    endCell: [number, number];
  }> = [
    { direction: "top-to-bottom", startCell: [1, 0], endCell: [1, 2] },
    { direction: "bottom-to-top", startCell: [1, 2], endCell: [1, 0] },
    { direction: "left-to-right", startCell: [0, 1], endCell: [2, 1] },
    { direction: "right-to-left", startCell: [2, 1], endCell: [0, 1] },
    {
      direction: "top-left-to-bottom-right",
      startCell: [0, 0],
      endCell: [2, 2],
    },
    {
      direction: "bottom-right-to-top-left",
      startCell: [2, 2],
      endCell: [0, 0],
    },
    {
      direction: "top-right-to-bottom-left",
      startCell: [2, 0],
      endCell: [0, 2],
    },
    {
      direction: "bottom-left-to-top-right",
      startCell: [0, 2],
      endCell: [2, 0],
    },
  ];

  it.each(cases)("$direction fades start→end across the box", ({
    direction,
    startCell,
    endCell,
  }) => {
    const op = makeArtOpacity({ start: 1, end: 0, direction }, COLS, ROWS);
    expect(op(...startCell)).toBeCloseTo(1);
    expect(op(...endCell)).toBeCloseTo(0);
    expect(op(1, 1)).toBeCloseTo(0.5); // center is always the midpoint
  });

  it("interpolates linearly between start and end", () => {
    const op = makeArtOpacity(
      { start: 0.2, end: 0.8, direction: "left-to-right" },
      COLS,
      ROWS,
    );
    expect(op(0, 0)).toBeCloseTo(0.2);
    expect(op(1, 0)).toBeCloseTo(0.5);
    expect(op(2, 0)).toBeCloseTo(0.8);
  });

  it("pins a single-cell span to start (no axis to fade along)", () => {
    const op = makeArtOpacity(
      { start: 0.3, end: 0.9, direction: "top-to-bottom" },
      1,
      1,
    );
    expect(op(0, 0)).toBeCloseTo(0.3);
  });
});
