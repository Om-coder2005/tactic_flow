// ============================================
// TacticFlow — Shared Arrow Geometry Utility
// Single source of truth for straight and curved arrows
// All canvas calculations and hit-testing share this logic.
// ============================================

import type { ArrowObject, CurvedArrowObject, DashedArrowObject, DashedCurvedObject, TacticalObject } from '@/types';
import { pitchToCanvas, canvasToPitch } from '@/features/canvas/pitchUtils';

export type AnyArrow = ArrowObject | CurvedArrowObject | DashedArrowObject | DashedCurvedObject;

export interface Point2D {
  x: number;
  y: number;
}

export function isCurvedArrow(arrow: AnyArrow): boolean {
  return arrow.type === 'curved_arrow' || arrow.type === 'dashed_curved';
}

/**
 * Calculates Quadratic Bézier point B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
 */
export function getQuadraticPoint(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Calculates Derivative B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
 */
export function getQuadraticTangent(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
  const mt = 1 - t;
  return {
    x: 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

/**
 * Computes Bézier control point P1 so that the quadratic curve passes exactly through mouse position P_mid.
 * For Quadratic Bézier B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2 = P_mid
 * => P1 = 2 * P_mid - 0.5 * P0 - 0.5 * P2
 */
export function calculateControlFromPassThrough(from: Point2D, passThrough: Point2D, to: Point2D): Point2D {
  return {
    x: 2 * passThrough.x - 0.5 * from.x - 0.5 * to.x,
    y: 2 * passThrough.y - 0.5 * from.y - 0.5 * to.y,
  };
}

/**
 * Computes initial subtle control point when converting a straight line to a curve
 */
export function calculateInitialControlPoint(from: Point2D, to: Point2D, offsetDistance = 15): Point2D {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const perpAngle = angle + Math.PI / 2;
  const passThrough = {
    x: midX + Math.cos(perpAngle) * offsetDistance,
    y: midY + Math.sin(perpAngle) * offsetDistance,
  };
  return calculateControlFromPassThrough(from, passThrough, to);
}

export interface ArrowResolvedPositions {
  fromPitch: Point2D;
  toPitch: Point2D;
  bendPitch: Point2D | null;
  fromCanvas: Point2D;
  toCanvas: Point2D;
  bendCanvas: Point2D | null;
}

/**
 * Resolves player attachment magnetized endpoints and canvas coordinates
 */
export function resolveArrowPositions(
  arrow: AnyArrow,
  allObjects: TacticalObject[] = [],
  stageWidth: number,
  stageHeight: number
): ArrowResolvedPositions {
  let fromX = arrow.from_x;
  let fromY = arrow.from_y;
  let toX = arrow.to_x;
  let toY = arrow.to_y;

  if (arrow.from_id && allObjects) {
    const parent = allObjects.find((o) => o.id === arrow.from_id);
    if (parent) {
      fromX = parent.x;
      fromY = parent.y;
    }
  }

  if (arrow.to_id && allObjects) {
    const parent = allObjects.find((o) => o.id === arrow.to_id);
    if (parent) {
      toX = parent.x;
      toY = parent.y;
    }
  }

  const fromCanvas = pitchToCanvas(fromX, fromY, stageWidth, stageHeight);
  const toCanvas = pitchToCanvas(toX, toY, stageWidth, stageHeight);

  const isCurved = isCurvedArrow(arrow);
  const curvedObj = arrow as (CurvedArrowObject | DashedCurvedObject);

  let bendPitch: Point2D | null = null;
  let bendCanvas: Point2D | null = null;

  if (isCurved) {
    if (curvedObj.bend_x != null && curvedObj.bend_y != null) {
      bendPitch = { x: curvedObj.bend_x, y: curvedObj.bend_y };
      const b = pitchToCanvas(curvedObj.bend_x, curvedObj.bend_y, stageWidth, stageHeight);
      bendCanvas = { x: b.cx, y: b.cy };
    } else {
      // Sensible default control point if bend_x/y is missing
      const initCanvas = calculateInitialControlPoint(
        { x: fromCanvas.cx, y: fromCanvas.cy },
        { x: toCanvas.cx, y: toCanvas.cy },
        20
      );
      bendCanvas = initCanvas;
      const initPitch = canvasToPitch(initCanvas.x, initCanvas.y, stageWidth, stageHeight);
      bendPitch = { x: initPitch.x, y: initPitch.y };
    }
  }

  return {
    fromPitch: { x: fromX, y: fromY },
    toPitch: { x: toX, y: toY },
    bendPitch,
    fromCanvas: { x: fromCanvas.cx, y: fromCanvas.cy },
    toCanvas: { x: toCanvas.cx, y: toCanvas.cy },
    bendCanvas,
  };
}

export interface ComputedArrowPath {
  start: Point2D;
  control: Point2D | null;
  end: Point2D;
  points: number[]; // Flat array of canvas points for rendering
  tangentAtEnd: Point2D;
  arrowheadAngle: number; // Angle in radians at endpoint
}

/**
 * Computes exact render path with player node padding and endpoint tangents
 */
export function computeArrowRenderPath(
  positions: ArrowResolvedPositions,
  isCurved: boolean,
  hasFromAttachment: boolean,
  hasToAttachment: boolean,
  nodePaddingRadius = 22
): ComputedArrowPath {
  const p0 = { ...positions.fromCanvas };
  const p2 = { ...positions.toCanvas };
  const p1 = isCurved && positions.bendCanvas ? { ...positions.bendCanvas } : null;

  // Apply attachment padding
  if (hasFromAttachment) {
    const target = isCurved && p1 ? p1 : p2;
    const angle = Math.atan2(target.y - p0.y, target.x - p0.x);
    p0.x += Math.cos(angle) * nodePaddingRadius;
    p0.y += Math.sin(angle) * nodePaddingRadius;
  }

  if (hasToAttachment) {
    const source = isCurved && p1 ? p1 : p0;
    const angle = Math.atan2(p2.y - source.y, p2.x - source.x);
    p2.x -= Math.cos(angle) * nodePaddingRadius;
    p2.y -= Math.sin(angle) * nodePaddingRadius;
  }

  let points: number[] = [];
  let tangentAtEnd: Point2D = { x: 1, y: 0 };

  if (isCurved && p1) {
    // Generate multi-segment points along quadratic Bezier curve for accurate hit testing and rendering
    const STEPS = 20;
    points = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const pt = getQuadraticPoint(p0, p1, p2, t);
      points.push(pt.x, pt.y);
    }
    // True tangent at t = 1 is B'(1) = 2*(P2 - P1)
    tangentAtEnd = getQuadraticTangent(p0, p1, p2, 1);
  } else {
    points = [p0.x, p0.y, p2.x, p2.y];
    tangentAtEnd = { x: p2.x - p0.x, y: p2.y - p0.y };
  }

  const arrowheadAngle = Math.atan2(tangentAtEnd.y, tangentAtEnd.x);

  return {
    start: p0,
    control: p1,
    end: p2,
    points,
    tangentAtEnd,
    arrowheadAngle,
  };
}

/**
 * Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
 */
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Precise hit testing for straight and curved arrows with visual tolerance margin
 */
export function hitTestArrowPath(points: number[], testX: number, testY: number, tolerance = 12): boolean {
  if (points.length < 4) return false;
  for (let i = 0; i < points.length - 2; i += 2) {
    const d = distToSegment(testX, testY, points[i]!, points[i + 1]!, points[i + 2]!, points[i + 3]!);
    if (d <= tolerance) return true;
  }
  return false;
}
