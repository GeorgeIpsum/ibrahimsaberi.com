# CurvedText Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** A `CurvedText` component that morphs text between three phases — flat span → 3D cylinder around the y-axis → flat spinning 2D ring — per the approved spec at `plans/superpowers/specs/2026-07-02-curved-text-design.md`.

**Architecture:** Pure geometry math lives in `curved-text-geometry.ts` (unit-tested). The component drives two motion values (`progress` 0→2, `spin` degrees) through nested `preserve-3d` divs: perspective container → tilt (`rotateX`) → spinner (`rotateY`) → per-letter spans whose transforms/opacity derive from the motion values via `useTransform`.

**Tech Stack:** React 19, motion 12.38 (`motion/react`), Tailwind v4, vitest (root harness), Storybook (`services/storybook`, `@storybook/nextjs-vite`).

## Global Constraints

- **Do NOT run any git commands (no add/commit/branch). The user handles all gitops.** Where a normal plan step would say "commit", simply stop.
- `src/components/text/circular-text.tsx` must remain untouched.
- Lint: `pnpm lint` (biome) must stay clean; use `// biome-ignore lint/correctness/useExhaustiveDependencies: <reason>` comments in the same style as `circular-text.tsx` where motion values are intentionally omitted from deps.
- Unit tests live at `__tests__/*.test.ts` (root vitest, node environment, `@` → `src` alias). Run with `pnpm test`.
- Component code is client-side (`"use client"`).

### Geometry cheat-sheet (used across tasks)

- `r = size / 2` (ring radius), `t = clamp(progress, MIN_BEND, 1)`, `MIN_BEND = 0.001`.
- Bend radius `R = r / t` — flat text is a cylinder of near-infinite radius.
- Letter angle (radians): `φ = [(1−t)·flatX + t·r·θ_ring] · t / r` where `flatX` is the measured flat offset and `θ_ring` the equal-spaced ring angle in radians. At `t→0` the world x-position `R·sin(φ) ≈ flatX` (natural span); at `t=1`, `φ = θ_ring`.
  - NOTE: this corrects the spec's looser description — a plain angle lerp would leak ring-arc spacing into the flat state.
- Tip-over: `flip = clamp(progress − 1, 0, 1) · 90` degrees on the tilt div; each letter counter-rotates `rotateX(−flip)` so glyphs end face-up.
- z-compensation on the tilt div: `−r·(1 − clamp(progress, 0, 1))` keeps the flat span at z=0 while the cylinder/ring stay centered on the tilt pivot.

---

### Task 1: Geometry module (TDD)

**Files:**
- Test: `__tests__/curved-text-geometry.test.ts`
- Create: `src/components/text/curved-text-geometry.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (Task 2 imports these exact names):
  - `interface LetterGeometry { flatX: number; ringAngleDeg: number; radius: number }`
  - `ringAngleDeg(index: number, count: number): number`
  - `bendAngleDeg(p: number, g: LetterGeometry): number`
  - `letterTransform(p: number, g: LetterGeometry): string`
  - `letterOpacity(p: number, spinDeg: number, g: LetterGeometry): number`
  - `tiltTransform(p: number, radius: number): string`
  - `const MIN_BEND: number`, `const REAR_OPACITY: number`

- [x] **Step 1: Write the failing test**

Create `__tests__/curved-text-geometry.test.ts`:

```ts
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

const geom = (flatX: number, ringAngle: number, radius = 100): LetterGeometry => ({
  flatX,
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test -- curved-text-geometry`
Expected: FAIL — cannot resolve `@/components/text/curved-text-geometry`.

- [x] **Step 3: Write the implementation**

Create `src/components/text/curved-text-geometry.ts`:

```ts
// Pure geometry for CurvedText. Flat text is modeled as a cylinder of
// near-infinite radius; morph progress p runs 0 (flat) → 1 (cylinder)
// → 2 (ring, tipped 90° around the x-axis).

export const MIN_BEND = 0.001;
export const REAR_OPACITY = 0.25;

export interface LetterGeometry {
  /** Measured offset of the glyph center from the text center in the flat span, px. */
  flatX: number;
  /** Equal-spaced angle around the ring, degrees, centered on 0. */
  ringAngleDeg: number;
  /** Ring (and cylinder) radius, px. */
  radius: number;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const ringAngleDeg = (index: number, count: number): number =>
  (360 / count) * (index - (count - 1) / 2);

export const bendAngleDeg = (p: number, g: LetterGeometry): number => {
  const t = Math.max(clamp01(p), MIN_BEND);
  const ringRad = (g.ringAngleDeg * Math.PI) / 180;
  // The letter's arc-length position slides from its natural flat offset to
  // its equal-spaced ring position while the strip bends; the angle is that
  // arc divided by the current bend radius (radius / t).
  const arc = (1 - t) * g.flatX + t * g.radius * ringRad;
  const rad = (arc * t) / g.radius;
  return (rad * 180) / Math.PI;
};

export const letterTransform = (p: number, g: LetterGeometry): string => {
  const t = Math.max(clamp01(p), MIN_BEND);
  const bendRadius = g.radius / t;
  const flip = clamp01(p - 1) * 90;
  return `translate(-50%, -50%) translateZ(${g.radius - bendRadius}px) rotateY(${bendAngleDeg(p, g)}deg) translateZ(${bendRadius}px) rotateX(${-flip}deg)`;
};

export const letterOpacity = (
  p: number,
  spinDeg: number,
  g: LetterGeometry,
): number => {
  const facingRad = ((bendAngleDeg(p, g) + spinDeg) * Math.PI) / 180;
  const frontness = (Math.cos(facingRad) + 1) / 2;
  // Full dimming at the cylinder, none while flat or once the ring flattens.
  const dimStrength = clamp01(p) * (1 - clamp01(p - 1));
  const dimmed = REAR_OPACITY + (1 - REAR_OPACITY) * frontness;
  return 1 + dimStrength * (dimmed - 1);
};

export const tiltTransform = (p: number, radius: number): string => {
  const flip = clamp01(p - 1) * 90;
  const zComp = -radius * (1 - clamp01(p));
  return `rotateX(${flip}deg) translateZ(${zComp}px)`;
};
```

Note: `-0` interpolates as `"0"` in template literals, so the `rotateX(0deg)` / `translateZ(0px)` assertions pass without special-casing.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test -- curved-text-geometry`
Expected: PASS (16 tests).

Also run the full suite to check nothing else broke: `pnpm test`
Expected: PASS.

- [x] **Step 5: Lint**

Run: `pnpm lint`
Expected: clean. (No commit — user handles git.)

---

### Task 2: CurvedText component

**Files:**
- Create: `src/components/text/curved-text.tsx`
- Modify: `src/components/text/index.ts` (add one export line)

**Interfaces:**
- Consumes: everything from `./curved-text-geometry` (Task 1 signatures).
- Produces: `CurvedText` (named export), `CurvedTextProps`, `CurvedTextPhase` — Task 3's story imports `CurvedText`, `CurvedTextPhase`, and `CurvedTextProps` from `@/components/text/curved-text`.

- [x] **Step 1: Write the component**

Create `src/components/text/curved-text.tsx`:

```tsx
"use client";

import {
  animate,
  motion,
  type MotionValue,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  type LetterGeometry,
  letterOpacity,
  letterTransform,
  ringAngleDeg,
  tiltTransform,
} from "./curved-text-geometry";

export type CurvedTextPhase = "flat" | "cylinder" | "ring";

export interface CurvedTextProps {
  text: string;
  /** Controlled morph target; transitions animate through intermediate phases. */
  phase: CurvedTextPhase;
  /** Ring/cylinder diameter in px. */
  size?: number;
  /** Seconds per revolution. */
  spinDuration?: number;
  /** Seconds per unit of phase distance (flat→ring covers two units). */
  morphDuration?: number;
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers";
  className?: string;
}

const PHASE_PROGRESS: Record<CurvedTextPhase, number> = {
  flat: 0,
  cylinder: 1,
  ring: 2,
};

const HOVER_MULTIPLIER: Record<
  NonNullable<CurvedTextProps["onHover"]>,
  number
> = {
  slowDown: 0.5,
  speedUp: 4,
  pause: 0,
  goBonkers: 20,
};

const HOVER_SPRING = { type: "spring", damping: 20, stiffness: 300 } as const;

interface CurvedLetterProps {
  letter: string;
  geometry: LetterGeometry;
  progress: MotionValue<number>;
  spin: MotionValue<number>;
}

const CurvedLetter = ({
  letter,
  geometry,
  progress,
  spin,
}: CurvedLetterProps) => {
  const transform = useTransform(progress, (p) => letterTransform(p, geometry));
  const opacity = useTransform([progress, spin], ([p, s]: number[]) =>
    letterOpacity(p, s, geometry),
  );

  return (
    <motion.span
      className="absolute top-1/2 left-1/2 inline-block whitespace-pre"
      style={{ transform, opacity }}
    >
      {letter}
    </motion.span>
  );
};

export const CurvedText = ({
  text,
  phase,
  size = 200,
  spinDuration = 20,
  morphDuration = 1.2,
  onHover = "speedUp",
  className = "",
}: CurvedTextProps) => {
  const letters = Array.from(text);
  const count = letters.length;
  const radius = size / 2;

  const progress = useMotionValue(PHASE_PROGRESS[phase]);
  const spin = useMotionValue(0);
  const scale = useMotionValue(1);
  const [flatOffsets, setFlatOffsets] = useState<number[] | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const hoverMultiplier = useRef(1);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Measure natural per-letter offsets from the hidden flat copy so the flat
  // state keeps real letter spacing instead of circumference-stretched spacing.
  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const mid = el.offsetWidth / 2;
      setFlatOffsets(
        Array.from(el.children, (child) => {
          const span = child as HTMLElement;
          return span.offsetLeft + span.offsetWidth / 2 - mid;
        }),
      );
    };
    measure();
    // Glyph metrics shift when webfonts finish loading.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: progress is a stable motion value
  useEffect(() => {
    const target = PHASE_PROGRESS[phase];
    const controls = animate(progress, target, {
      duration: morphDuration * Math.abs(target - progress.get()),
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [phase, morphDuration]);

  // In the flat phase the spin settles forward to the next full turn so the
  // span sits still and aligned; useAnimationFrame below is what spins the
  // other phases.
  // biome-ignore lint/correctness/useExhaustiveDependencies: spin is a stable motion value
  useEffect(() => {
    if (phase !== "flat") return;
    const controls = animate(spin, Math.ceil(spin.get() / 360) * 360, {
      duration: 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [phase]);

  useAnimationFrame((_, delta) => {
    if (phaseRef.current === "flat") return;
    spin.set(
      spin.get() + (delta / 1000) * (360 / spinDuration) * hoverMultiplier.current,
    );
  });

  const handleHoverStart = () => {
    if (phaseRef.current === "flat") return;
    hoverMultiplier.current = HOVER_MULTIPLIER[onHover];
    if (onHover === "goBonkers") animate(scale, 0.8, HOVER_SPRING);
  };

  const handleHoverEnd = () => {
    hoverMultiplier.current = 1;
    animate(scale, 1, HOVER_SPRING);
  };

  const tilt = useTransform(progress, (p) => tiltTransform(p, radius));
  const spinner = useTransform(spin, (s) => `rotateY(${s}deg)`);

  return (
    <motion.div
      aria-label={text}
      className={`relative ${className}`}
      style={{ width: size, height: size, perspective: size * 4, scale }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <span ref={measureRef} aria-hidden className="invisible absolute whitespace-pre">
        {letters.map((letter, i) => (
          <span
            key={`measure-${i.toString()}`}
            className="inline-block whitespace-pre"
          >
            {letter}
          </span>
        ))}
      </span>
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ transform: tilt, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transform: spinner, transformStyle: "preserve-3d" }}
        >
          {flatOffsets?.length === count &&
            letters.map((letter, i) => (
              <CurvedLetter
                key={`letter-${i.toString()}`}
                letter={letter}
                geometry={{
                  flatX: flatOffsets[i],
                  ringAngleDeg: ringAngleDeg(i, count),
                  radius,
                }}
                progress={progress}
                spin={spin}
              />
            ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
```

Implementation notes for the engineer:

- The spinner div sits INSIDE the tilt div — that's what makes the y-axis carousel spin become the in-plane ring spin with no handoff.
- Letters render only once `flatOffsets` matches the current letter count, so a text change never pairs stale offsets with new letters. Measurement happens in `useLayoutEffect` (before paint), so there's no visible flash.
- `translate(-50%, -50%)` leads each letter transform; with the default `transform-origin: center` the 3D chain pivots around each glyph's center.
- Hover speed changes are instantaneous multipliers on the frame-loop velocity (matching CircularText's spirit without restarting tweens); `goBonkers` also spring-scales the whole container to 0.8 like CircularText does.

- [x] **Step 2: Export from the barrel**

In `src/components/text/index.ts`, add (alphabetical position — first line):

```ts
export * from "./curved-text";
```

- [x] **Step 3: Typecheck and lint**

Run: `pnpm exec tsc --noEmit`
Expected: clean. If `useTransform([progress, spin], ([p, s]: number[]) => ...)` trips motion 12's multi-value overload typing, change the callback to `(latest: number[]) => letterOpacity(latest[0], latest[1], geometry)`.

Run: `pnpm lint`
Expected: clean. If biome flags the `useLayoutEffect` deps, add the same style of `biome-ignore` comment used on the other effects.

(No commit — user handles git.)

---

### Task 3: Storybook story + visual verification

**Files:**
- Create: `services/storybook/stories/curved-text.stories.tsx`

**Interfaces:**
- Consumes: `CurvedText`, `CurvedTextPhase`, `CurvedTextProps` from `@/components/text/curved-text` (the storybook Vite config already aliases `@` → repo `src`).
- Produces: stories `Text/CurvedText` → `Playground` (phase radio control) and `Stepper` (in-canvas phase buttons).

- [x] **Step 1: Write the story**

Create `services/storybook/stories/curved-text.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  CurvedText,
  type CurvedTextPhase,
  type CurvedTextProps,
} from "@/components/text/curved-text";

const phases: CurvedTextPhase[] = ["flat", "cylinder", "ring"];

const meta = {
  title: "Text/CurvedText",
  component: CurvedText,
  parameters: { layout: "centered" },
  args: {
    text: "the quick brown fox ",
    phase: "flat",
    size: 240,
    spinDuration: 20,
    morphDuration: 1.2,
    onHover: "speedUp",
    className: "font-black text-2xl",
  },
  argTypes: {
    phase: { control: "radio", options: phases },
    onHover: {
      control: "select",
      options: ["slowDown", "speedUp", "pause", "goBonkers"],
    },
  },
} satisfies Meta<typeof CurvedText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const PhaseStepper = (args: CurvedTextProps) => {
  const [phase, setPhase] = useState<CurvedTextPhase>(args.phase);
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex gap-2">
        {phases.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhase(p)}
            className={`rounded border px-3 py-1 text-sm ${
              phase === p ? "border-current font-bold" : "opacity-60"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <CurvedText {...args} phase={phase} />
    </div>
  );
};

export const Stepper: Story = {
  render: (args) => <PhaseStepper {...args} />,
};
```

- [x] **Step 2: Build storybook to catch compile errors**

Run: `pnpm --filter ui-storybook build`
Expected: build succeeds.

- [x] **Step 3: Visual verification in the browser**

Run in background: `pnpm --filter ui-storybook dev` (port 6006), then open
`http://localhost:6006/?path=/story/text-curvedtext--stepper` with the browser tools and verify against this checklist:

1. **flat** — text reads as a normal, naturally-spaced span, fully opaque, not spinning.
2. **flat → cylinder** — the text visibly bends around the forming cylinder (no letters teleporting), spin ramps in.
3. **cylinder** — 3D carousel around the y-axis; far-side letters dimmed toward 0.25 opacity, never fully hidden; near-side fully opaque.
4. **cylinder → ring** — the whole cylinder tips over around the x-axis; spin does NOT stutter or jump during the tip.
5. **ring** — a perfect flat 2D circle (no perspective skew), spinning in-plane, all letters fully opaque, matching CircularText's look.
6. **ring, reading direction** — the text should read in order around the circle like CircularText. If it reads mirrored/inside-out, negate the sign in ONE place — `ringAngleDeg` (return `-(360 / count) * ...`) — and re-check; update the Task 1 test expectations to match.
7. **hover in cylinder/ring** — `speedUp` accelerates smoothly on hover and returns on leave; switch the `onHover` arg to `goBonkers` and confirm the 0.8 scale-down.
8. **ring → flat** — reverse morph passes back through the cylinder; spin settles forward so the flat text lands aligned and static.

Fix anything that fails the checklist (geometry sign issues belong in `curved-text-geometry.ts` with tests updated to match), then re-run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm lint`.

(No commit — user handles git.)
