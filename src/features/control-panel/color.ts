/**
 * Small, dependency-free color conversions for the control-panel color picker.
 * Hex strings are handled WITHOUT a leading `#` (that's how control values are
 * stored). HSV is the picker's working space: it survives the trip through
 * grayscale (where hue is otherwise undefined) so the hue control doesn't jump.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  /** Hue in degrees, 0–360. */
  h: number;
  /** Saturation, 0–1. */
  s: number;
  /** Value / brightness, 0–1. */
  v: number;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Parse a hex color (no `#`; 3 or 6 digits — partial input is padded) to RGB. */
export const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const int = Number.parseInt(full, 16) || 0;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

/** Serialize RGB to a 6-digit lowercase hex string (no `#`). */
export const rgbToHex = ({ r, g, b }: RGB): string => {
  const to2 = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `${to2(r)}${to2(g)}${to2(b)}`;
};

/** Convert RGB (0–255) to HSV. Hue is 0 for achromatic (gray) colors. */
export const rgbToHsv = ({ r, g, b }: RGB): HSV => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : d / max, v: max };
};

/** Convert HSV back to RGB (0–255, unrounded — round when serializing). */
export const hsvToRgb = ({ h, s, v }: HSV): RGB => {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};
