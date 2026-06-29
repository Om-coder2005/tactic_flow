// ============================================
// TacticFlow — Tactical Object Types
// Discriminated union matching Section 5.1 exactly
// All x/y are pitch-relative (0–100). NEVER pixels.
// ============================================

// ---------- Base ----------

export interface TacticalObjectBase {
  id: string;
  x: number; // pitch-relative 0–100
  y: number; // pitch-relative 0–100
  rotation?: number; // degrees, default 0
  locked: boolean;
  z_index: number;
}

// ---------- Player / Goalkeeper ----------

export type NodeStyle = 'circle' | 'square' | 'diamond';
export type Team = 'home' | 'away' | 'neutral';

export interface PlayerObject extends TacticalObjectBase {
  type: 'player';
  label: string;
  number: string | null;
  fill_color: string;
  outline_color: string;
  style: NodeStyle;
  team: Team;
}

export interface GoalkeeperObject extends TacticalObjectBase {
  type: 'goalkeeper';
  label: string;
  number: string | null;
  fill_color: string;
  outline_color: string;
  style: NodeStyle;
  team: Team;
}

// ---------- Ball ----------

export interface BallObject extends TacticalObjectBase {
  type: 'ball';
}

// ---------- Equipment ----------

export interface ConeObject extends TacticalObjectBase {
  type: 'cone';
  color?: string;
}

export interface LadderObject extends TacticalObjectBase {
  type: 'ladder';
  color?: string;
}

export interface MiniGoalObject extends TacticalObjectBase {
  type: 'mini_goal';
  color?: string;
}

export interface MannequinObject extends TacticalObjectBase {
  type: 'mannequin';
  color?: string;
}

// ---------- Arrows ----------

export type ArrowheadStyle = 'open' | 'filled' | 'none' | 't-bar' | 'hollow';

export interface ArrowObject extends TacticalObjectBase {
  type: 'arrow';
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  from_id?: string; // Magnetized link start
  to_id?: string;   // Magnetized link end
  color: string;
  width: number;
  dash: boolean;
  arrowhead: ArrowheadStyle;
}

export interface CurvedArrowObject extends TacticalObjectBase {
  type: 'curved_arrow';
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  from_id?: string;
  to_id?: string;
  bend_x: number | null;
  bend_y: number | null;
  color: string;
  width: number;
  dash: boolean;
  arrowhead: ArrowheadStyle;
}

export interface DashedArrowObject extends TacticalObjectBase {
  type: 'dashed_arrow';
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  from_id?: string;
  to_id?: string;
  color: string;
  width: number;
  dash: true;
  arrowhead: ArrowheadStyle;
}

export interface DashedCurvedObject extends TacticalObjectBase {
  type: 'dashed_curved';
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  from_id?: string;
  to_id?: string;
  bend_x: number | null;
  bend_y: number | null;
  color: string;
  width: number;
  dash: true;
  arrowhead: ArrowheadStyle;
}

// ---------- Zone / Shape ----------

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'polygon';

export interface ZoneObject extends TacticalObjectBase {
  type: 'zone';
  width: number;
  height: number;
  shape_type: ShapeType;
  fill_color: string;
  fill_opacity: number;
  stroke_color: string;
  label: string | null;
}

export interface ShapeObject extends TacticalObjectBase {
  type: 'shape';
  width: number;
  height: number;
  shape_type: ShapeType;
  fill_color: string;
  fill_opacity: number;
  stroke_color: string;
  label: string | null;
}

// ---------- Text / Callout ----------

export interface TextObject extends TacticalObjectBase {
  type: 'text';
  text: string;
  font_size: number;
  color: string;
  background: string | null;
}

export interface CalloutObject extends TacticalObjectBase {
  type: 'callout';
  text: string;
  font_size: number;
  color: string;
  background: string | null;
  callout_number: number | null;
}

// ---------- Freehand ----------

export interface FreehandObject extends TacticalObjectBase {
  type: 'freehand';
  points: number[]; // flat [x0,y0,x1,y1,...] pitch-relative
  color: string;
  width: number;
}

// ---------- Discriminated Union ----------

export type TacticalObject =
  | PlayerObject
  | GoalkeeperObject
  | BallObject
  | ConeObject
  | LadderObject
  | MiniGoalObject
  | MannequinObject
  | ArrowObject
  | CurvedArrowObject
  | DashedArrowObject
  | DashedCurvedObject
  | ZoneObject
  | ShapeObject
  | TextObject
  | CalloutObject
  | FreehandObject;

export type TacticalObjectType = TacticalObject['type'];

// ---------- Interpolation classification ----------

/** Object types whose positions interpolate between frames */
export const INTERPOLATABLE_TYPES: ReadonlySet<TacticalObjectType> = new Set([
  'player',
  'goalkeeper',
  'ball',
]);

/** Object types that snap between frames (no interpolation) */
export const SNAP_TYPES: ReadonlySet<TacticalObjectType> = new Set([
  'arrow',
  'curved_arrow',
  'dashed_arrow',
  'dashed_curved',
  'zone',
  'shape',
  'text',
  'callout',
  'freehand',
  'cone',
  'ladder',
  'mini_goal',
  'mannequin',
]);
