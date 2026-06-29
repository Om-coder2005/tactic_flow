import { v4 as uuidv4 } from 'uuid';
import type {
  PlayerObject,
  GoalkeeperObject,
  BallObject,
  ConeObject,
  LadderObject,
  MiniGoalObject,
  MannequinObject,
  ArrowObject,
  CurvedArrowObject,
  DashedArrowObject,
  DashedCurvedObject,
  FreehandObject,
  ZoneObject,
  ShapeObject,
  TextObject,
  TacticalObject,
} from '@/types';
import type { ToolType } from '@/stores/editorStore';

// ----------------------------------------------------
// Discrete Object Factories (Click once to place)
// ----------------------------------------------------

export function createPlayer(x: number, y: number, team: 'home' | 'away' = 'home'): PlayerObject {
  return {
    id: uuidv4(),
    type: 'player',
    x,
    y,
    locked: false,
    z_index: 20, // Players sit above zones/lines
    label: team === 'home' ? 'HM' : 'AW',
    number: null,
    fill_color: team === 'home' ? '#ef4444' : '#3b82f6',
    outline_color: team === 'home' ? '#b91c1c' : '#1d4ed8',
    style: 'circle',
    team,
  };
}

export function createGoalkeeper(x: number, y: number, team: 'home' | 'away' = 'home'): GoalkeeperObject {
  return {
    id: uuidv4(),
    type: 'goalkeeper',
    x,
    y,
    locked: false,
    z_index: 20,
    label: 'GK',
    number: '1',
    fill_color: team === 'home' ? '#f59e0b' : '#10b981',
    outline_color: team === 'home' ? '#d97706' : '#059669',
    style: 'square',
    team,
  };
}

export function createBall(x: number, y: number): BallObject {
  return {
    id: uuidv4(),
    type: 'ball',
    x,
    y,
    locked: false,
    z_index: 30, // Balls sit on top of everything
  };
}

export function createEquipment(type: 'cone' | 'ladder' | 'mini_goal' | 'mannequin', x: number, y: number): TacticalObject {
  let defaultColor = '#000000';
  switch (type) {
    case 'cone': defaultColor = '#f59e0b'; break;
    case 'ladder': defaultColor = '#8b5cf6'; break;
    case 'mini_goal': defaultColor = '#6b7280'; break;
    case 'mannequin': defaultColor = '#ef4444'; break;
  }
  return {
    id: uuidv4(),
    type,
    x,
    y,
    locked: false,
    z_index: 15,
    color: defaultColor
  } as TacticalObject;
}

export function createText(x: number, y: number): TextObject {
  return {
    id: uuidv4(),
    type: 'text',
    x,
    y,
    locked: false,
    z_index: 25,
    text: 'Click right panel to edit text...',
    font_size: 16,
    color: '#000000',
    background: '#ffffff',
  };
}

// ----------------------------------------------------
// Drawing Draft Factories (Drag to draw)
// ----------------------------------------------------

export function startArrow(x: number, y: number, isDashed: boolean): ArrowObject | DashedArrowObject {
  return {
    id: uuidv4(),
    type: isDashed ? 'dashed_arrow' : 'arrow',
    x, // For base compat, we might not use raw x/y but it still satisfies interface
    y,
    from_x: x,
    from_y: y,
    to_x: x,
    to_y: y,
    color: '#1a1a1a',
    width: 3,
    dash: isDashed,
    arrowhead: 'filled',
    locked: false,
    z_index: 12,
  } as any;
}

export function startZone(x: number, y: number): ZoneObject {
  return {
    id: uuidv4(),
    type: 'zone',
    x, // This forms the origin for drawing
    y,
    width: 0,
    height: 0,
    shape_type: 'rect',
    fill_color: '#3b82f6',
    fill_opacity: 0.2, // Transparent box
    stroke_color: '#3b82f6',
    label: null,
    locked: false,
    z_index: 5, // Zones lie under almost everything
  };
}

export function startFreehand(x: number, y: number): FreehandObject {
  return {
    id: uuidv4(),
    type: 'freehand',
    x,
    y,
    points: [x, y],
    color: '#1a1a1a',
    width: 3,
    locked: false,
    z_index: 10,
  };
}

// ----------------------------------------------------
// Central Routing
// ----------------------------------------------------

export function handleToolPlacement(tool: ToolType, x: number, y: number): TacticalObject | null {
  switch (tool) {
    case 'player': return createPlayer(x, y, 'home');
    case 'goalkeeper': return createGoalkeeper(x, y, 'home');
    case 'ball': return createBall(x, y);
    case 'cone':
    case 'ladder':
    case 'mini_goal':
    case 'mannequin':
      return createEquipment(tool, x, y);
    case 'text':
    case 'callout':
      return createText(x, y);
    // Drawables
    case 'arrow': return startArrow(x, y, false);
    case 'dashed_arrow': return startArrow(x, y, true);
    case 'curved_arrow': {
      const arr = startArrow(x, y, false) as unknown as CurvedArrowObject;
      arr.type = 'curved_arrow';
      arr.bend_x = null;
      arr.bend_y = null;
      return arr;
    }
    case 'dashed_curved': {
      const arr = startArrow(x, y, true) as unknown as DashedCurvedObject;
      arr.type = 'dashed_curved';
      arr.bend_x = null;
      arr.bend_y = null;
      return arr;
    }
    case 'zone': return startZone(x, y);
    case 'shape': {
      const shape = startZone(x, y) as unknown as ShapeObject;
      shape.type = 'shape';
      shape.fill_opacity = 1; // Solid
      shape.fill_color = '#1a1a1a';
      return shape;
    }
    case 'pencil': return startFreehand(x, y);
    default: return null;
  }
}
