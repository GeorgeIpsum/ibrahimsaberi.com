"use client";
// unceremoniously yoinked from performative-ui: https://github.com/vorpus/performativeUI/blob/main/src/components/AsciiHero.tsx

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
  art: string;

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
  color?: string;
  /** Glyph alpha (0–1). Default 1 (fully covers the field cell beneath). */
  opacity?: number;
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
interface PreparedPlacement extends AsciiArtPlacement {
  lines: string[];
  artCols: number;
  artRows: number;
  color: string;
  opacity: number;
}

/** Pre-split art into lines and measure its bounding box once. */
function prepareArt(
  art: AsciiArtPlacement | AsciiArtPlacement[] | undefined,
): PreparedPlacement[] {
  if (art == null) return [];
  const list = Array.isArray(art) ? art : [art];
  return list.map((p) => {
    const lines = p.art.replace(/\r\n/g, "\n").split("\n");
    const artCols = lines.reduce((max, line) => Math.max(max, line.length), 0);
    return {
      ...p,
      lines,
      artCols,
      artRows: lines.length,
      color: p.color ?? "#fff",
      opacity: p.opacity ?? 1,
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
    art,
  } = options;

  const palette = useMemo<string[] | null>(
    () => paletteOpt ?? (colorful ? DEFAULT_PALETTE : null),
    [paletteOpt, colorful],
  );

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
    let dpr = 1;
    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      baseField = new Float32Array(cols * rows);
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

      cols = colsOpt ?? Math.max(1, Math.floor(rect.width / cellW));
      rows = rowsOpt ?? Math.max(1, Math.floor(rect.height / cellH));

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

      const rampMax = charRamp.length - 1;
      const useSpotlight =
        typeof spotlightOpacity === "number" &&
        spotlightOpacity !== baseOpacity;
      const spotR2 = spotlightRadius * spotlightRadius * 2;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const base = baseField[y * cols + x];
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
          const ch = charRamp[Math.floor(v * rampMax)];
          if (ch === " ") continue;

          // Per-cell alpha.
          let alpha = baseOpacity;
          if (useSpotlight && mouseInside) {
            const spot = Math.exp(-d2 / spotR2);
            alpha = baseOpacity + (spotlightOpacity - baseOpacity) * spot;
            if (alpha < 0) alpha = 0;
            if (alpha > 1) alpha = 1;
          }
          if (alpha <= 0.01) continue;

          // Per-cell color.
          let color = "#c8c8d4";
          if (palette?.length) {
            const huePos = (x * 0.1 + y * 0.07 + time * 0.12) % palette.length;
            const idx = Math.floor(Math.abs(huePos));
            color = palette[idx % palette.length];
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
          ctx.globalAlpha = p.opacity;
          for (let ly = 0; ly < p.lines.length; ly++) {
            const gy = origin.y + ly;
            if (gy < 0 || gy >= rows) continue;
            const line = p.lines[ly];
            for (let lx = 0; lx < line.length; lx++) {
              const ch = line[lx];
              if (ch === " ") continue;
              const gx = origin.x + lx;
              if (gx < 0 || gx >= cols) continue;
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
 *       art={{ art: "  /\\_/\\\n ( o.o )\n  > ^ <", anchor: "center" }} />
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
