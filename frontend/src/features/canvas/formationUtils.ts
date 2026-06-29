import type { TacticalObject } from '@/types';

/**
 * Calculates the centroid (mean X and Y) of a group of objects.
 */
export function getCentroid(objects: TacticalObject[]) {
  if (objects.length === 0) return { x: 0, y: 0 };
  const sumX = objects.reduce((acc, o) => acc + o.x, 0);
  const sumY = objects.reduce((acc, o) => acc + o.y, 0);
  return {
    x: sumX / objects.length,
    y: sumY / objects.length,
  };
}

/**
 * Scales the position of objects relative to their centroid.
 * Useful for adjusting formation width/depth.
 */
export function scaleFromCentroid(
  objects: TacticalObject[],
  scaleX: number,
  scaleY: number
) {
  const centroid = getCentroid(objects);
  
  return objects.map((obj) => {
    // Distance from centroid
    const dx = obj.x - centroid.x;
    const dy = obj.y - centroid.y;
    
    return {
      id: obj.id,
      x: Math.max(0, Math.min(100, centroid.x + dx * scaleX)),
      y: Math.max(0, Math.min(100, centroid.y + dy * scaleY)),
    };
  });
}

/**
 * Aligns objects to a specific edge or center.
 */
export function alignObjects(
  objects: TacticalObject[],
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
) {
  if (objects.length < 2) return [];

  const xs = objects.map((o) => o.x);
  const ys = objects.map((o) => o.y);

  let targetX: number | undefined;
  let targetY: number | undefined;

  switch (type) {
    case 'left': targetX = Math.min(...xs); break;
    case 'right': targetX = Math.max(...xs); break;
    case 'center': targetX = xs.reduce((a, b) => a + b) / xs.length; break;
    case 'top': targetY = Math.min(...ys); break;
    case 'bottom': targetY = Math.max(...ys); break;
    case 'middle': targetY = ys.reduce((a, b) => a + b) / ys.length; break;
  }

  return objects.map((obj) => ({
    id: obj.id,
    x: targetX !== undefined ? targetX : obj.x,
    y: targetY !== undefined ? targetY : obj.y,
  }));
}
