// ============================================
// TacticFlow — Pitch Coordinate Utilities
// AGENT RULE: All canvas coordinates use pitch-relative 0–100.
// Pixel conversion happens ONLY at render time via these helpers.
// ============================================

/**
 * Convert pitch-relative coords (0–100) to canvas pixel coords.
 */
export function pitchToCanvas(
  x: number,
  y: number,
  stageWidth: number,
  stageHeight: number
): { cx: number; cy: number } {
  return {
    cx: (x / 100) * stageWidth,
    cy: (y / 100) * stageHeight,
  };
}

/**
 * Convert canvas pixel coords back to pitch-relative (0–100).
 */
export function canvasToPitch(
  cx: number,
  cy: number,
  stageWidth: number,
  stageHeight: number
): { x: number; y: number } {
  return {
    x: (cx / stageWidth) * 100,
    y: (cy / stageHeight) * 100,
  };
}

/**
 * Snap a pitch-relative value to the nearest increment (default 1.0 = 1%).
 */
export function snapToGrid(value: number, step = 1.0): number {
  return Math.round(value / step) * step;
}

/**
 * Clamp a pitch-relative value to [0, 100].
 */
export function clampPitch(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Convert a pitch-relative size/distance to canvas pixels.
 */
export function pitchSizeToCanvas(
  size: number,
  stageWidth: number,
  stageHeight: number,
  axis: 'x' | 'y' = 'x'
): number {
  return axis === 'x'
    ? (size / 100) * stageWidth
    : (size / 100) * stageHeight;
}

/**
 * Get default stage dimensions maintaining pitch aspect ratio.
 * Full pitch is roughly 68m × 105m ≈ 0.647:1 (Vertical)
 */
export function getPitchDimensions(
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } {
  const PITCH_RATIO = 105 / 68;

  let width = containerWidth;
  let height = width / PITCH_RATIO;

  if (height > containerHeight) {
    height = containerHeight;
    width = height * PITCH_RATIO;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Ease-in-out cubic for playback interpolation.
 * Section 10 of the spec.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolate position between two points with easing.
 */
export function interpolatePosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rawT: number
): { x: number; y: number } {
  const t = easeInOutCubic(rawT);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}
