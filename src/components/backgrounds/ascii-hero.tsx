// unceremoniously yoinked from performative-ui: https://github.com/vorpus/performativeUI/blob/main/src/components/AsciiHero.tsx
"use client";

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/css/lib";

/** Named placement anchors — shortcuts for common `at` fractions. */
export type AsciiArtAnchor =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

/**
 * Axis a fading opacity gradient travels along, named `<from>-to-<to>`.
 * The four edges fade across one axis; the four corners fade along a
 * diagonal. `start`/`end` opacities are sampled at the named ends.
 */
export type AsciiGradientDirection =
  | "top-to-bottom"
  | "bottom-to-top"
  | "left-to-right"
  | "right-to-left"
  | "top-left-to-bottom-right"
  | "bottom-left-to-top-right"
  | "top-right-to-bottom-left"
  | "bottom-right-to-top-left";

/**
 * A linear opacity fade applied across an art block's bounding box.
 * Glyphs at the `direction`'s start end render at `start` alpha and fade
 * to `end` alpha at the opposite end; cells in between interpolate
 * linearly. Use in place of a constant `opacity`.
 */
export interface AsciiArtOpacityGradient {
  /** Alpha (0–1) at the gradient's start edge/corner. */
  start: number;
  /** Alpha (0–1) at the gradient's end edge/corner. */
  end: number;
  /** Axis the fade travels along. */
  direction: AsciiGradientDirection;
}

/**
 * A block of static ASCII art pinned to a region of the field. Its glyphs
 * are drawn on top of the (still-animating) procedural field with a fixed
 * color/opacity — untouched by the wave, ripple, or cursor spotlight.
 */
export interface AsciiArtPlacement {
  /**
   * Multi-line ASCII string. Split on "\n" into one grid row per line.
   * Spaces are transparent, so the field shows through internal gaps.
   * Use spaces (not tabs) for alignment — a tab is a single grid cell.
   */
  ascii: string;

  /* ----- Position (precedence: col/row → at/anchor, then offset) ----- */
  /**
   * Explicit top-left cell column. Only honored when the field has fixed
   * `cols` AND `rows`; otherwise the auto-grid makes fixed coords
   * meaningless and placement falls back to `at`/`anchor`.
   */
  col?: number;
  /** Explicit top-left cell row. See `col` for the fixed-grid requirement. */
  row?: number;
  /** Normalized 0–1 position within the grid. `{ x: 0.5, y: 0.5 }` centers. */
  at?: { x: number; y: number };
  /** Named anchor; shorthand for an `at` fraction. Default "center". */
  anchor?: AsciiArtAnchor;
  /**
   * Shift from the resolved spot. A number is cells; a "10%" string
   * resolves against grid cols (x) / rows (y).
   */
  offset?: { x?: number | string; y?: number | string };

  /* ----- Look (static; ignores palette + spotlight) ----- */
  /** Glyph color. Default "#fff". */
  color?: `#${string}` | `--${string}`;
  /**
   * Glyph alpha. Either a constant (0–1; default 1, fully covering the
   * field cell beneath) or an {@link AsciiArtOpacityGradient} that fades
   * between two alphas across the art's bounding box in one of eight
   * cardinal/diagonal directions. Spaces stay transparent either way.
   */
  opacity?: number | AsciiArtOpacityGradient;
}

export interface UseAsciiFieldOptions {
  /** Grid width in cells. Default: auto-computed from container width. */
  cols?: number;
  /** Grid height in cells. Default: auto-computed from container height. */
  rows?: number;
  /** Font size in px for rendered characters. Default 11. */
  fontSize?: number;
  /** Font family override (must be monospace). */
  fontFamily?: string;
  /** Characters from sparsest to densest. */
  charRamp?: string;

  /* ----- Color ----- */
  /** Paint with the default aurora palette. */
  colorful?: boolean;
  /** Custom palette (overrides `colorful`). */
  palette?: string[];
  /** Base alpha (0–1). Drop low (≈ 0.18) to use as a background. */
  baseOpacity?: number;

  /* ----- Cursor ----- */
  /** Enable cursor reactivity (ripple + spotlight). */
  reactive?: boolean;
  /** Cursor ripple amplitude. */
  rippleStrength?: number;
  /** Cursor ripple falloff radius (cells). */
  rippleRadius?: number;
  /** Alpha used at the cursor center; falls off radially to baseOpacity. */
  spotlightOpacity?: number;
  /** Cursor spotlight radius (cells). */
  spotlightRadius?: number;

  /** ms throttle between frames. Default 50. */
  frameMs?: number;

  /* ----- Entrance ----- */
  /**
   * Wipe the field in row by row on mount instead of popping in all at
   * once. The animation plays once per mount; theme/prop changes mid-life
   * don't replay it. Default true.
   */
  reveal?: boolean;
  /** ms between consecutive rows starting their fade-in. Default 22. */
  revealStagger?: number;
  /** ms for a single row to fade fully in. Default 420. */
  revealDuration?: number;

  /* ----- Static art ----- */
  /**
   * One or more blocks of static ASCII art overlaid on the field. Each is
   * pinned to a region and rendered with its own color/opacity, immune to
   * the animation and cursor spotlight.
   */
  art?: AsciiArtPlacement | AsciiArtPlacement[];
}

const DEFAULT_RAMP =
  " .`'\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const DEFAULT_PALETTE = ["#a78bfa", "#ec4899", "#67e8f9", "#fbbf24"];

/** Named anchors expressed as the normalized fraction they pin to. */
const ANCHOR_FRACTIONS: Record<AsciiArtAnchor, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  top: { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  left: { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  right: { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  bottom: { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

/** A placement with its art pre-split into lines and dimensions measured. */
interface PreparedPlacement extends Omit<AsciiArtPlacement, "color"> {
  lines: string[];
  artCols: number;
  artRows: number;
  color: string;
  /** Per-glyph alpha at local cell (lx, ly) within the art bounding box. */
  opacityAt: (lx: number, ly: number) => number;
}

/**
 * Normalized position (0–1) of a cell along a gradient's axis: 0 at the
 * direction's start end, 1 at its end. `fx`/`fy` are the cell's fractional
 * position within the bounding box (0 = left/top, 1 = right/bottom).
 * Diagonals average the two axes so the fade runs corner-to-corner.
 */
function gradientT(
  direction: AsciiGradientDirection,
  fx: number,
  fy: number,
): number {
  switch (direction) {
    case "top-to-bottom":
      return fy;
    case "bottom-to-top":
      return 1 - fy;
    case "left-to-right":
      return fx;
    case "right-to-left":
      return 1 - fx;
    case "top-left-to-bottom-right":
      return (fx + fy) / 2;
    case "bottom-right-to-top-left":
      return 1 - (fx + fy) / 2;
    case "top-right-to-bottom-left":
      return (1 - fx + fy) / 2;
    case "bottom-left-to-top-right":
      return (fx + (1 - fy)) / 2;
    default:
      return 0;
  }
}

/**
 * Resolve an `opacity` prop into a per-cell alpha sampler over an art block
 * `artCols`×`artRows` in size. A number yields a constant; a gradient
 * interpolates `start`→`end` along its direction. Always clamped to [0, 1].
 * Exported for unit testing the direction math.
 */
export function makeArtOpacity(
  opacity: number | AsciiArtOpacityGradient | undefined,
  artCols: number,
  artRows: number,
): (lx: number, ly: number) => number {
  if (opacity == null) return () => 1;
  if (typeof opacity === "number") {
    const v = Math.max(0, Math.min(1, opacity));
    return () => v;
  }
  const { start, end, direction } = opacity;
  return (lx, ly) => {
    // A single-cell span has no axis to fade along; pin it to `start`.
    const fx = artCols > 1 ? lx / (artCols - 1) : 0;
    const fy = artRows > 1 ? ly / (artRows - 1) : 0;
    const t = gradientT(direction, fx, fy);
    return Math.max(0, Math.min(1, start + (end - start) * t));
  };
}

/** Pre-split art into lines and measure its bounding box once. */
function prepareArt(
  art: AsciiArtPlacement | AsciiArtPlacement[] | undefined,
): PreparedPlacement[] {
  if (art == null) return [];
  const list = Array.isArray(art) ? art : [art];
  return list.map((p) => {
    const lines = p.ascii.replace(/\r\n/g, "\n").split("\n");
    const artCols = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const artRows = lines.length;
    let color: string = p.color ?? "#fff";

    if (typeof getComputedStyle !== "undefined" && color.startsWith("--")) {
      // is css var (maybe), so see if we can get the computed value from the document
      const computed = getComputedStyle(
        document.documentElement,
      ).getPropertyValue(color);
      if (computed) {
        console.log(color);
        color = computed;
      } else {
        console.warn(
          "attempted to use css var for ascii art color, but it was not found:",
          color,
        );
        color = "#fff";
      }
    }

    return {
      ...p,
      lines,
      artCols,
      artRows,
      color,
      opacityAt: makeArtOpacity(p.opacity, artCols, artRows),
    };
  });
}

/** Resolve an offset value to cells. Numbers are cells; "10%" is % of span. */
function resolveOffset(value: number | string | undefined, span: number) {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.trim().endsWith("%") ? (n / 100) * span : n;
}

/** Compute the top-left grid cell for a prepared placement. */
function placeArt(
  p: PreparedPlacement,
  cols: number,
  rows: number,
  hasFixedGrid: boolean,
): { x: number; y: number } {
  if (hasFixedGrid && typeof p.col === "number" && typeof p.row === "number") {
    return { x: p.col, y: p.row };
  }
  const frac = p.at ?? ANCHOR_FRACTIONS[p.anchor ?? "center"];
  const x = frac.x * (cols - p.artCols) + resolveOffset(p.offset?.x, cols);
  const y = frac.y * (rows - p.artRows) + resolveOffset(p.offset?.y, rows);
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Drives a `<canvas>` (sized to its `host` parent) with a procedural
 * ASCII field. Supports per-cell color (aurora palette) and per-cell
 * opacity (cursor spotlight). Auto-resizes on container change.
 */
export function useAsciiField(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hostRef: RefObject<HTMLElement | null>,
  options: UseAsciiFieldOptions = {},
): void {
  const {
    cols: colsOpt,
    rows: rowsOpt,
    fontSize = 11,
    fontFamily = "JetBrains Mono, ui-monospace, monospace",
    charRamp = DEFAULT_RAMP,
    colorful = false,
    palette: paletteOpt,
    baseOpacity = 1,
    reactive = true,
    rippleStrength = 1.4,
    rippleRadius = 6,
    spotlightOpacity,
    spotlightRadius = 8,
    frameMs = 50,
    reveal = true,
    revealStagger = 22,
    revealDuration = 420,
    art,
  } = options;

  const palette = useMemo<string[] | null>(
    () => paletteOpt ?? (colorful ? DEFAULT_PALETTE : null),
    [paletteOpt, colorful],
  );

  // The entrance wipe plays once per mount. This ref survives effect
  // re-runs (e.g. a theme/palette change) so the field doesn't re-wipe
  // every time an option changes.
  const revealedRef = useRef(false);

  // Prepare art outside the animation effect and read it through a ref, so
  // changing the art repaints on the next frame without tearing down and
  // re-seeding the whole field.
  const placements = useMemo(() => prepareArt(art), [art]);
  const placementsRef = useRef(placements);
  placementsRef.current = placements;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastFrame = 0;
    let cols = 0;
    let rows = 0;
    let cellW = 0;
    let cellH = 0;
    let baseField = new Float32Array(0);
    // Per-frame scratch: intensity, empty-cell mask, and the distance from
    // each cell to the nearest empty cell (drives the color ripple).
    let vField = new Float32Array(0);
    let emptyField = new Uint8Array(0);
    let distField = new Float32Array(0);
    let dpr = 1;
    const mouse = { x: -9999, y: -9999 };

    // Entrance timeline: the timestamp of the first painted frame, so the
    // field can wipe in top-to-bottom one row at a time. -1 until set.
    let revealStart = -1;

    const seed = () => {
      baseField = new Float32Array(cols * rows);
      vField = new Float32Array(cols * rows);
      emptyField = new Uint8Array(cols * rows);
      distField = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = (x / cols) * 2 - 1;
          const ny = (y / rows) * 2 - 1;
          const r = Math.sqrt(nx * nx + ny * ny);
          const stripes = 0.5 + 0.5 * Math.sin(nx * 6 + ny * 2);
          const radial = 1 - Math.min(1, r * 1.2);
          baseField[y * cols + x] = 0.25 * stripes + 0.55 * radial;
        }
      }
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      // CSS (position: absolute; inset: 0) handles the display size.

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "top";

      // Monospace cell metrics.
      const m = ctx.measureText("M");
      const measured = m.width || fontSize * 0.6;
      cellW = measured;
      cellH = fontSize * 1.15;

      cols = colsOpt ?? Math.max(1, Math.ceil(rect.width / cellW));
      rows = rowsOpt ?? Math.max(1, Math.ceil(rect.height / cellH));

      // If consumer fixed cols/rows, redistribute the cell size to fit.
      if (colsOpt !== undefined) cellW = rect.width / cols;
      if (rowsOpt !== undefined) cellH = rect.height / rows;

      seed();
    };

    const render = (t: number) => {
      if (t - lastFrame < frameMs) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastFrame = t;
      if (cols === 0 || rows === 0) {
        // Container may not have laid out yet; retry until it has.
        resize();
        raf = requestAnimationFrame(render);
        return;
      }

      const time = t * 0.001;
      const rect = canvas.getBoundingClientRect();
      const cx = (mouse.x - rect.left) / cellW;
      const cy = (mouse.y - rect.top) / cellH;
      // We track the cursor on the window so foreground overlays don't
      // swallow the spotlight. Only react when the cursor is actually
      // over (or just outside) the canvas's bounding rect.
      const margin = 24; // px of grace so the effect doesn't snap off at the edge
      const mouseInside =
        mouse.x >= rect.left - margin &&
        mouse.x <= rect.right + margin &&
        mouse.y >= rect.top - margin &&
        mouse.y <= rect.bottom + margin;

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Entrance wipe: start the clock on this first valid frame, then fade
      // each grid row in `revealStagger` ms after the one above it. Once the
      // bottom row has finished, latch it done so it never replays.
      if (revealStart < 0) revealStart = t;
      const revealActive = reveal && !revealedRef.current;
      const rowReveal = (gy: number): number => {
        if (!revealActive) return 1;
        const e = t - revealStart - gy * revealStagger;
        if (e <= 0) return 0;
        if (e >= revealDuration) return 1;
        const x = e / revealDuration;
        return x * x * (3 - 2 * x); // smoothstep ease
      };
      if (
        revealActive &&
        t - revealStart >= (rows - 1) * revealStagger + revealDuration
      ) {
        revealedRef.current = true;
      }

      const rampMax = charRamp.length - 1;
      const useSpotlight =
        typeof spotlightOpacity === "number" &&
        spotlightOpacity !== baseOpacity;
      const spotR2 = spotlightRadius * spotlightRadius * 2;

      // Pass 1 — intensity + emptiness for every cell (whole grid, so the
      // distance transform below is correct even under the entrance wipe).
      // distField seeds to 0 at empty cells, +inf elsewhere.
      const INF = 1e9;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const base = baseField[i];
          const wave =
            0.15 *
            Math.sin(x * 0.18 + time * 1.4) *
            Math.cos(y * 0.22 - time * 1.1);

          const dx = x - cx;
          const dy = (y - cy) * 1.8;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2);

          const ripple =
            reactive && mouseInside
              ? rippleStrength * Math.exp(-d2 / 80) -
                0.6 * Math.exp(-((d - rippleRadius) * (d - rippleRadius)) / 30)
              : 0;

          const v = Math.max(0, Math.min(1, base + wave + ripple));
          vField[i] = v;
          const empty = charRamp[Math.floor(v * rampMax)] === " " ? 1 : 0;
          emptyField[i] = empty;
          distField[i] = empty ? 0 : INF;
        }
      }

      // Pass 2 — chamfer distance transform: every cell learns how far it is
      // from the nearest empty cell. Vertical steps are weighted by the ~1.8
      // cell aspect so the resulting rings read circular on screen. Two
      // sweeps (forward + backward) propagate distances across the grid.
      const A = 1; // horizontal step
      const B = 1.8; // vertical step
      const C = Math.sqrt(A * A + B * B); // diagonal step
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          let dv = distField[i];
          if (x > 0) dv = Math.min(dv, distField[i - 1] + A);
          if (y > 0) dv = Math.min(dv, distField[i - cols] + B);
          if (x > 0 && y > 0) dv = Math.min(dv, distField[i - cols - 1] + C);
          if (x < cols - 1 && y > 0)
            dv = Math.min(dv, distField[i - cols + 1] + C);
          distField[i] = dv;
        }
      }
      for (let y = rows - 1; y >= 0; y--) {
        for (let x = cols - 1; x >= 0; x--) {
          const i = y * cols + x;
          let dv = distField[i];
          if (x < cols - 1) dv = Math.min(dv, distField[i + 1] + A);
          if (y < rows - 1) dv = Math.min(dv, distField[i + cols] + B);
          if (x < cols - 1 && y < rows - 1)
            dv = Math.min(dv, distField[i + cols + 1] + C);
          if (x > 0 && y < rows - 1)
            dv = Math.min(dv, distField[i + cols - 1] + C);
          distField[i] = dv;
        }
      }

      // Pass 3 — draw. Each rendered glyph is colored by its distance to the
      // nearest empty blob; subtracting time marches the bands outward, so
      // the palette appears to ripple out of every hole in the field.
      const len = palette?.length ?? 0;
      for (let y = 0; y < rows; y++) {
        const rowAlpha = rowReveal(y);
        if (rowAlpha <= 0) continue; // row hasn't entered yet — leave blank
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (emptyField[i]) continue; // the hole itself stays empty
          const v = vField[i];
          const ch = charRamp[Math.floor(v * rampMax)];

          // Per-cell alpha (cursor spotlight).
          let alpha = baseOpacity;
          if (useSpotlight && mouseInside) {
            const dx = x - cx;
            const dy = (y - cy) * 1.8;
            const spot = Math.exp(-(dx * dx + dy * dy) / spotR2);
            alpha = baseOpacity + (spotlightOpacity - baseOpacity) * spot;
            if (alpha < 0) alpha = 0;
            if (alpha > 1) alpha = 1;
          }
          alpha *= rowAlpha; // entrance wipe scales the whole row in
          if (alpha <= 0.01) continue;

          // Per-cell color: palette band keyed to distance-from-hole.
          let color = "#c8c8d4";
          if (len) {
            const huePos = distField[i] * 0.18 - time * 0.6;
            const idx = ((Math.floor(huePos) % len) + len) % len;
            color = (palette as string[])[idx];
          }

          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillText(ch, x * cellW, y * cellH);
        }
      }
      ctx.globalAlpha = 1;

      // Static art: drawn on top of the field with its own color/opacity,
      // so the wave/ripple/spotlight never touch it. Spaces are transparent.
      const placements = placementsRef.current;
      if (placements.length) {
        const hasFixedGrid = colsOpt !== undefined && rowsOpt !== undefined;
        for (const p of placements) {
          const origin = placeArt(p, cols, rows, hasFixedGrid);
          ctx.fillStyle = p.color;
          for (let ly = 0; ly < p.lines.length; ly++) {
            const gy = origin.y + ly;
            if (gy < 0 || gy >= rows) continue;
            const rowAlpha = rowReveal(gy);
            if (rowAlpha <= 0) continue; // row hasn't entered yet
            const line = p.lines[ly];
            for (let lx = 0; lx < line.length; lx++) {
              const ch = line[lx];
              if (ch === " ") continue;
              const gx = origin.x + lx;
              if (gx < 0 || gx >= cols) continue;
              // Per-glyph alpha: the gradient (or constant) sampled at this
              // cell, scaled by the entrance wipe's per-row fade.
              const alpha = p.opacityAt(lx, ly) * rowAlpha;
              if (alpha <= 0.01) continue;
              ctx.globalAlpha = alpha;
              ctx.fillText(ch, gx * cellW, gy * cellH);
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(render);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Listening on window (not host) so the spotlight fires even when
    // the cursor is over foreground content stacked above the canvas.
    if (reactive) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (reactive) {
        window.removeEventListener("mousemove", onMove);
      }
    };
  }, [
    canvasRef,
    hostRef,
    colsOpt,
    rowsOpt,
    fontSize,
    fontFamily,
    charRamp,
    palette,
    baseOpacity,
    reactive,
    rippleStrength,
    rippleRadius,
    spotlightOpacity,
    spotlightRadius,
    frameMs,
    reveal,
    revealStagger,
    revealDuration,
  ]);
}

export interface AsciiHeroProps
  extends ComponentPropsWithoutRef<"div">,
    UseAsciiFieldOptions {
  /**
   * Visual treatment:
   *   - "panel" (default): bordered card with backdrop. Use as a hero.
   *   - "bare": no chrome. Use as a background layer (`position: absolute; inset: 0`).
   */
  variant?: "panel" | "bare";
}

/**
 * A canvas-rendered ASCII field that reacts to the cursor. Drop it into
 * a hero as a chrome'd panel, or absolutely-position the `bare` variant
 * behind your content to use it as a background.
 *
 *     <AsciiHero />                                       // panel
 *     <AsciiHero variant="bare" colorful baseOpacity={0.18}
 *       spotlightOpacity={0.9} spotlightRadius={10} />    // background
 *
 * Pass `art` to pin static ASCII over the field, unaffected by the
 * animation or spotlight:
 *
 *     <AsciiHero variant="bare" baseOpacity={0.2}
 *       art={{ ascii: "  /\\_/\\\n ( o.o )\n  > ^ <", anchor: "center" }} />
 *
 * An art block's `opacity` can be a constant or a gradient that fades it
 * across its bounding box in any of eight cardinal/diagonal directions:
 *
 *     art={{ ascii, anchor: "center",
 *       opacity: { start: 1, end: 0, direction: "top-to-bottom" } }}
 *
 * For full control over markup, drop the component and call
 * `useAsciiField(canvasRef, hostRef, options)` against your own DOM.
 */
export const AsciiHero = forwardRef<HTMLDivElement, AsciiHeroProps>(
  (
    {
      variant = "panel",
      cols,
      rows,
      fontSize,
      fontFamily,
      charRamp,
      colorful,
      palette,
      baseOpacity,
      reactive,
      rippleStrength,
      rippleRadius,
      spotlightOpacity,
      spotlightRadius,
      frameMs,
      reveal,
      revealStagger,
      revealDuration,
      art,
      className,
      ...rest
    },
    ref,
  ) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useAsciiField(canvasRef, hostRef, {
      cols,
      rows,
      fontSize,
      fontFamily,
      charRamp,
      colorful,
      palette,
      baseOpacity,
      reactive,
      rippleStrength,
      rippleRadius,
      spotlightOpacity,
      spotlightRadius,
      frameMs,
      reveal,
      revealStagger,
      revealDuration,
      art,
    });

    const setRef = (el: HTMLDivElement | null) => {
      hostRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref)
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    };

    return (
      <div
        ref={setRef}
        className={cn(
          "pui-ascii",
          variant === "panel" && "pui-ascii--panel",
          className,
        )}
        aria-hidden="true"
        {...rest}
      >
        <canvas ref={canvasRef} />
      </div>
    );
  },
);
AsciiHero.displayName = "AsciiHero";
