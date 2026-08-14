// Pure geometry for CurvedText. Flat text is modeled as a cylinder of
// near-infinite radius; morph progress p runs 0 (flat) → 1 (cylinder)
// → 2 (ring, tipped 90° around the x-axis).

export const MIN_BEND = 0.001;
export const REAR_OPACITY = 0.25;

export interface LetterGeometry {
  /** Measured offset of the glyph center from the text center in the flat span, px. */
  flatX: number;
  /** Measured vertical offset of the glyph center from the flat block's middle, px — nonzero when the flat text wraps onto multiple lines. */
  flatY: number;
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
  // Wrapped lines keep their vertical offset while flat, then converge into
  // the single cylinder band as the text bends.
  const y = (1 - clamp01(p)) * g.flatY;
  return `translate(-50%, -50%) translateY(${y}px) translateZ(${g.radius - bendRadius}px) rotateY(${bendAngleDeg(p, g)}deg) translateZ(${bendRadius}px) rotateX(${-flip}deg)`;
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
