/** Pure camera math for the /now ambient rotating map. */

export const AUTO_ROTATE_DEG_PER_SEC = 6;
export const DRAG_DEG_PER_PX = 0.35;
export const RESUME_DELAY_MS = 3000;
export const RESUME_RAMP_MS = 1500;

/** Wrap any bearing into [0, 360). */
export function normalizeBearing(bearing: number): number {
  return ((bearing % 360) + 360) % 360;
}

/** Dragging right (positive dx) pulls the world with the pointer, so bearing decreases. */
export function bearingAfterDrag(bearing: number, dxPx: number): number {
  return normalizeBearing(bearing - dxPx * DRAG_DEG_PER_PX);
}

/**
 * Auto-rotation speed in deg/s, quadratically easing from 0 to full over
 * RESUME_RAMP_MS so the map doesn't jerk back into motion after a drag.
 */
export function autoRotateSpeed(
  msSinceResume: number,
  rotate = AUTO_ROTATE_DEG_PER_SEC,
): number {
  if (msSinceResume <= 0) return 0;
  const t = Math.min(msSinceResume / RESUME_RAMP_MS, 1);
  return rotate * t * t;
}
