# CurvedText — 3D bend-and-tip text component

**Date:** 2026-07-02
**Status:** Approved

## Overview

A new `CurvedText` component at `src/components/text/curved-text.tsx` that animates text
through three phases:

1. **flat** — text renders as a normal inline span, static and readable.
2. **cylinder** — letters bend around the y-axis into a 3D carousel, spinning continuously.
3. **ring** — the cylinder tips over 90° around the x-axis until the letters form a flat 2D
   circle spinning in the screen plane, visually identical to the existing `CircularText`
   (`src/components/text/circular-text.tsx`, which stays untouched).

Transitions between phases are fluid and pass through intermediate geometry — switching
`flat → ring` visibly bends into the cylinder and then tips over.

## API

```tsx
interface CurvedTextProps {
  text: string;
  phase: "flat" | "cylinder" | "ring"; // controlled by parent
  size?: number;          // ring/cylinder diameter in px, default 200; changes animate (spring)
  spinDuration?: number;  // seconds per revolution, default 20
  morphDuration?: number; // seconds per unit of phase distance (flat→ring is two units), default 1.2
  sizeTransition?: {
    stagger?: boolean;         // ripple the size change one character at a time, default false
    staggerDuration?: number;  // seconds between letters when staggering, default 0.05
    delay?: number;            // seconds before the size transition starts, default 0
    duration?: number;         // perceptual spring duration in seconds; omit for default spring physics
  };
  onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers"; // same semantics as CircularText
  onPhaseComplete?: (phase: CurvedTextPhase) => void; // fires when a morph finishes (not interrupted morphs or mount)
  onSizeComplete?: () => void; // fires when every letter's size animation settles after a size change (not on mount)
  className?: string;
}
```

`phase` is a controlled prop. The component owns the animation between phases; the parent
owns when phases change (can later be wired to a stepper, timer, scroll, or the control
panel).

## Animation architecture

Two motion values (motion/react) drive everything:

- **`progress`** — 0 = flat, 1 = cylinder, 2 = ring. Animated toward the phase's target
  value with a tween (`morphDuration`, easeInOut) whenever `phase` changes.
- **`spin`** — continuously growing rotation in degrees, same infinite-tween pattern as
  `CircularText`, with the same `onHover` behaviors (slowDown / speedUp / pause /
  goBonkers). In the flat phase the spin settles forward to the nearest multiple of 360°
  and pauses so the text sits still and aligned; it resumes when leaving flat.

DOM structure — three nested divs, inner two with `transform-style: preserve-3d`:

```
perspective container (static, width/height = size)
 └ tilt div: rotateX(flip) translateZ(zComp)
    │   flip  = progress 1→2 mapped to 0→90°
    │   zComp = −r·(1−min(progress,1))  — keeps the flat span at z=0 while the
    │           cylinder/ring stay centered on the tilt pivot
    └ spinner div: rotateY(spin)
       └ one absolutely-positioned span per letter
```

Because the spinner's y-rotation is nested inside the tilt, the same `spin` value that
turns the 3D carousel becomes the in-plane ring rotation once `flip` reaches 90° — no
handoff or stutter. After the tilt, the ring lies in a constant-z plane, so perspective
introduces no distortion: the final state is a perfect 2D circle.

## Letter geometry — the bend

Flat text is treated as a cylinder of infinite radius. With `t = clamp(progress, ε, 1)`
and ring radius `r = size / 2`:

- Bend radius: `R = r / t` (huge when flat, `r` at full cylinder).
- Letter angle: `φᵢ` interpolates from `xᵢ / R` (natural flat offset projected onto the
  huge circle) toward the equal-spaced ring angle `θᵢ = (360/n)·(i − (n−1)/2)` as `t → 1`.
- Per-letter transform, derived via `useTransform` from `progress` (plus `flip`):

  ```
  translateZ(r − R) rotateY(φᵢ) translateZ(R) rotateX(−flip)
  ```

At `t ≈ 0` this reduces to letters at their natural inline offsets facing the viewer; as
`t → 1` the text visibly bends around the shrinking cylinder like a paper strip. The
trailing `rotateX(−flip)` counter-rotates each glyph during the tip-over so letters end
face-up in the ring rather than edge-on.

**Natural flat spacing:** per-letter offsets `xᵢ` (centered) are measured from a hidden
inline copy of the text in a `useLayoutEffect`, re-measured when `text` changes. This
keeps the flat state looking like a genuinely normal span instead of
circumference-stretched equal spacing.

**Size animation:** `size` changes spring an internal `radius` motion value toward
`size / 2`; container width/height, perspective, tilt compensation, and every letter
transform derive from it, so the whole apparatus grows/shrinks smoothly in any phase.
Each letter owns its radius motion value, springing with
`delay = sizeTransition.delay + (stagger ? index · staggerDuration : 0)` — with `stagger`
on, a size change ripples through the text one character at a time (a traveling spiral in
the ring phase). `duration` swaps the default spring physics for a perceptual-duration
spring. The container box honors `delay`/`duration` but never staggers. The
flat wrap layout is the one discrete part — the hidden copy is fixed at the *target*
width (wrapping can't interpolate, and a mid-animation measure must never capture a
transient layout).

**Wrapping:** the hidden copy wraps naturally at the target container width
(`whitespace-pre-wrap`, plain inline spans so breaks happen at word boundaries), and each
letter also gets a vertical offset `yᵢ` measured from the block's middle. Letters carry
`translateY((1−p)·yᵢ)` so wrapped lines render true multi-line text in the flat phase and
converge into the single cylinder band as the text bends.

## Far-side dimming

In the cylinder phase, letters facing away from the viewer dim rather than mirror or
disappear. Per letter:

- Facing angle = `φᵢ + spin` (mod 360); opacity maps `cos(facing)` from 1 (front) to
  ~0.25 (rear).
- Dim strength scales with phase: 0 in flat, full at cylinder, back to 0 as the ring
  flattens (all letters face the viewer again). Strength =
  `min(progress, 1) · (1 − max(progress − 1, 0))`.

Opacity is derived from the same motion values via `useTransform`, so it updates
per-frame without React renders.

## Files

- **New:** `src/components/text/curved-text.tsx` — exports `CurvedText`.
- **Edit:** `src/components/text/index.ts` — add `export * from "./curved-text"`.
- **Untouched:** `src/components/text/circular-text.tsx`.

## Verification

Visual verification in the storybook service (`services/storybook`): a story rendering
`CurvedText` with buttons toggling `phase` between flat / cylinder / ring. Check each
resting state, the bend transition, the tip-over transition, spin continuity across the
tip-over, and hover behaviors in the ring state.

No unit tests — the component is purely visual/geometric; the repo has no test harness
for components.
