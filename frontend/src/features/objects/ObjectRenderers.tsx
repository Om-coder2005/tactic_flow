// BallMarker, ArrowRenderer, ZoneRenderer, TextRenderer, FreehandRenderer, EquipmentRenderer
// Stub renderers — each will be fully implemented incrementally
import React, { useCallback } from 'react';
import { Group, Circle, Arrow, Line, Rect, Text, Ellipse, RegularPolygon } from 'react-konva';
import { pitchToCanvas } from '@/features/canvas/pitchUtils';
import type {
  TacticalObject,
  BallObject,
  ArrowObject, CurvedArrowObject, DashedArrowObject, DashedCurvedObject,
  ZoneObject, ShapeObject,
  TextObject, CalloutObject,
  FreehandObject,
  ConeObject, LadderObject, MiniGoalObject, MannequinObject,
} from '@/types';

// ---------- Shared props ----------
interface BaseRenderProps<T> {
  obj: T;
  stageWidth: number;
  stageHeight: number;
  isSelected: boolean;
  onDragEnd: (id: string, cx: number, cy: number) => void;
  onTransformEnd?: (id: string, updates: Partial<TacticalObject>) => void;
  onClick: (id: string, shiftKey: boolean) => void;
  updateObject?: (id: string, updates: any) => void;
  onDragStart?: (id: string) => void;
  allObjects?: any[];
}

// ---------- Ball ----------
export const BallMarker: React.FC<BaseRenderProps<BallObject>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onClick }) => {
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={(obj as any)._opacity ?? 1}
        draggable={!obj.locked}
        onDragEnd={(e) => onDragEnd(obj.id, e.target.x(), e.target.y())}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={(e) => onClick(obj.id, false)}
        hitStrokeWidth={20}
        id={obj.id}
      >
        {/* Material Shadow */}
        <Circle
          radius={10}
          fill="black"
          opacity={0.2}
          offsetY={-2}
          shadowBlur={isSelected ? 6 : 3}
          listening={false}
        />

        {/* Selection Glow */}
        {isSelected && (
          <Circle
            radius={14}
            stroke="#eab308"
            strokeWidth={3}
            opacity={0.8}
            listening={false}
          />
        )}

        <Circle 
          radius={10} 
          fill="#ffffff" 
          stroke="#0f172a" 
          strokeWidth={2} 
        />
        
        {/* Retro ball pattern */}
        <Group listening={false}>
          <Circle radius={3} fill="#0f172a" />
          {[0, 72, 144, 216, 288].map(angle => (
            <Line
              key={angle}
              points={[0, 0, Math.cos(angle * Math.PI / 180) * 10, Math.sin(angle * Math.PI / 180) * 10]}
              stroke="#0f172a"
              strokeWidth={1.5}
              opacity={0.3}
            />
          ))}
        </Group>
      </Group>
    );
  }
);
BallMarker.displayName = 'BallMarker';

// ---------- Arrow ----------
import {
  resolveArrowPositions,
  computeArrowRenderPath,
  isCurvedArrow,
  calculateControlFromPassThrough,
  type AnyArrow,
} from './arrowGeometry';

export const ArrowRenderer: React.FC<BaseRenderProps<AnyArrow>> = React.memo((props) => {
  const { obj, stageWidth, stageHeight, isSelected, onDragEnd, onClick, allObjects = [] } = props;

  const arrowRef = React.useRef<any>(null);
  const tBarRef = React.useRef<any>(null);

  const isCurved = isCurvedArrow(obj);
  const positions = resolveArrowPositions(obj, allObjects, stageWidth, stageHeight);
  const path = computeArrowRenderPath(
    positions,
    isCurved,
    !!obj.from_id,
    !!obj.to_id,
    22
  );

  const isDashed = (obj as any).dash || (obj as any).type === 'dashed_arrow' || (obj as any).type === 'dashed_curved' || obj.intent === 'pass';

  const updateLineVisuals = (
    fromPos: { x: number; y: number },
    bendPos: { x: number; y: number } | null,
    toPos: { x: number; y: number },
    dragType: 'from' | 'to' | 'bend' | 'none'
  ) => {
    const tempPositions = {
      fromPitch: positions.fromPitch,
      toPitch: positions.toPitch,
      bendPitch: positions.bendPitch,
      fromCanvas: fromPos,
      toCanvas: toPos,
      bendCanvas: bendPos,
    };
    const tempPath = computeArrowRenderPath(
      tempPositions,
      isCurved,
      dragType === 'from' ? false : !!obj.from_id,
      dragType === 'to' ? false : !!obj.to_id,
      22
    );

    if (arrowRef.current) {
      arrowRef.current.points(tempPath.points);
    }

    if (tBarRef.current && obj.arrowhead === 't-bar') {
      const angle = tempPath.arrowheadAngle;
      const finalEx = tempPath.end.x;
      const finalEy = tempPath.end.y;
      const len = 14;
      const x1 = finalEx + Math.cos(angle + Math.PI / 2) * len;
      const y1 = finalEy + Math.sin(angle + Math.PI / 2) * len;
      const x2 = finalEx + Math.cos(angle - Math.PI / 2) * len;
      const y2 = finalEy + Math.sin(angle - Math.PI / 2) * len;
      tBarRef.current.points([x1, y1, x2, y2]);
    }
  };

  const renderArrowHeadExtra = () => {
    if (obj.arrowhead === 't-bar') {
      const angle = path.arrowheadAngle;
      const finalEx = path.end.x;
      const finalEy = path.end.y;
      const len = 14;
      const x1 = finalEx + Math.cos(angle + Math.PI / 2) * len;
      const y1 = finalEy + Math.sin(angle + Math.PI / 2) * len;
      const x2 = finalEx + Math.cos(angle - Math.PI / 2) * len;
      const y2 = finalEy + Math.sin(angle - Math.PI / 2) * len;
      return <Line ref={tBarRef} points={[x1, y1, x2, y2]} stroke={obj.color} strokeWidth={obj.width} listening={false} />;
    }
    return null;
  };

  return (
    <Group
      id={obj.id}
      draggable={false}
      onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
      onTap={() => onClick(obj.id, false)}
      opacity={(obj as any)._opacity ?? (isSelected ? 1 : 0.85)}
    >
      <Arrow
        ref={arrowRef}
        points={path.points}
        stroke={obj.color}
        strokeWidth={obj.width}
        fill={obj.arrowhead === 'none' ? 'transparent' : obj.color}
        dash={isDashed ? [8, 8] : undefined}
        pointerLength={['none', 't-bar'].includes(obj.arrowhead) ? 0 : 16}
        pointerWidth={['none', 't-bar'].includes(obj.arrowhead) ? 0 : 14}
        hitStrokeWidth={24}
        shadowBlur={2}
        shadowColor="rgba(0,0,0,0.3)"
        shadowOffsetY={1}
        draggable={!obj.locked}
        onDragStart={(e) => {
          e.cancelBubble = true;
          if (props.onDragStart) props.onDragStart(obj.id);
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
          const stage = e.target.getStage();
          if (!stage) return;

          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Convert mouse position to canvas coordinates
          const transform = stage.getAbsoluteTransform().copy().invert();
          const pCanvas = transform.point(pointer);

          // Calculate control point P1 so the Bezier curve passes directly through cursor pCanvas
          const p1Canvas = calculateControlFromPassThrough(
            positions.fromCanvas,
            pCanvas,
            positions.toCanvas
          );

          // Update live line visuals
          updateLineVisuals(
            positions.fromCanvas,
            p1Canvas,
            positions.toCanvas,
            'bend'
          );
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';

          // Reset the Konva Arrow node local offset back to zero
          e.target.x(0);
          e.target.y(0);

          if (!stage) return;

          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          const transform = stage.getAbsoluteTransform().copy().invert();
          const pCanvas = transform.point(pointer);

          const p1Canvas = calculateControlFromPassThrough(
            positions.fromCanvas,
            pCanvas,
            positions.toCanvas
          );

          const bX = (p1Canvas.x / stageWidth) * 100;
          const bY = (p1Canvas.y / stageHeight) * 100;

          const isPass = obj.intent === 'pass';

          if (props.updateObject) {
            props.updateObject(obj.id, {
              type: isPass ? 'dashed_curved' : 'curved_arrow',
              bend_x: bX,
              bend_y: bY,
            });
          }
        }}
        onMouseEnter={(e: any) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'grab';
        }}
        onMouseLeave={(e: any) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';
        }}
      />
      {renderArrowHeadExtra()}
      {obj.arrowhead === 'both' && (() => {
        const sx = path.start.x;
        const sy = path.start.y;
        const nextPt = path.points.length >= 4 ? { x: path.points[2]!, y: path.points[3]! } : path.end;
        const angle = Math.atan2(sy - nextPt.y, sx - nextPt.x);
        const len = 14;
        const p1X = sx + Math.cos(angle + Math.PI / 6) * len;
        const p1Y = sy + Math.sin(angle + Math.PI / 6) * len;
        const p2X = sx + Math.cos(angle - Math.PI / 6) * len;
        const p2Y = sy + Math.sin(angle - Math.PI / 6) * len;
        return (
          <Line
            points={[p1X, p1Y, sx, sy, p2X, p2Y]}
            stroke={obj.color}
            fill={obj.color}
            closed={true}
            strokeWidth={obj.width}
            listening={false}
          />
        );
      })()}

      {/* Start Point Marker if not linked to player */}
      {!obj.from_id && (
        <Circle
          x={positions.fromCanvas.x}
          y={positions.fromCanvas.y}
          radius={5}
          fill={obj.color}
          stroke="#ffffff"
          strokeWidth={1.5}
          listening={false}
        />
      )}

      {/* Draggable Bend Control Handle (CONTROL ●) */}
      {isSelected && isCurved && path.control && (
        <Circle
          x={path.control.x}
          y={path.control.y}
          radius={7}
          fill="#d97706"
          stroke="#ffffff"
          strokeWidth={2}
          draggable
          shadowBlur={4}
          shadowColor="rgba(0,0,0,0.3)"
          onDragStart={(e) => {
            e.cancelBubble = true;
            if (props.onDragStart) props.onDragStart(obj.id);
          }}
          onDragMove={(e) => {
            e.cancelBubble = true;
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'crosshair';
            updateLineVisuals(
              positions.fromCanvas,
              { x: e.target.x(), y: e.target.y() },
              positions.toCanvas,
              'bend'
            );
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
            const bX = (e.target.x() / stageWidth) * 100;
            const bY = (e.target.y() / stageHeight) * 100;
            if (props.updateObject) {
              props.updateObject(obj.id, { bend_x: bX, bend_y: bY });
            }
          }}
          onMouseEnter={(e: any) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'crosshair';
            e.target.scale({ x: 1.3, y: 1.3 });
          }}
          onMouseLeave={(e: any) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
            e.target.scale({ x: 1, y: 1 });
          }}
        />
      )}

      {/* Draggable Endpoint Handles (START ● ─────── ● END) */}
      {isSelected && (
        <>
          {/* START HANDLE */}
          <Circle
            x={positions.fromCanvas.x}
            y={positions.fromCanvas.y}
            radius={7}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            shadowBlur={4}
            shadowColor="rgba(0,0,0,0.3)"
            onDragStart={(e) => {
              e.cancelBubble = true;
              if (props.onDragStart) props.onDragStart(obj.id);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'crosshair';
              updateLineVisuals(
                { x: e.target.x(), y: e.target.y() },
                positions.bendCanvas,
                positions.toCanvas,
                'from'
              );
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'default';

              e.target.x(0);
              e.target.y(0);

              const fx = (positions.fromCanvas.x / stageWidth) * 100; // positions was updated live
              const pointer = stage?.getPointerPosition();
              if (!pointer) return;
              const transform = stage?.getAbsoluteTransform().copy().invert();
              const pCanvas = transform?.point(pointer);
              if (!pCanvas) return;

              const realFx = (pCanvas.x / stageWidth) * 100;
              const realFy = (pCanvas.y / stageHeight) * 100;

              // Check if dropped on a player for magnetized attachment
              let newFromId: string | undefined = undefined;
              if (allObjects) {
                const targetPlayer = allObjects.find((o) => {
                  if (o.type !== 'player' && o.type !== 'goalkeeper') return false;
                  const dist = Math.hypot(o.x - realFx, o.y - realFy);
                  return dist < 4.0;
                });
                if (targetPlayer) {
                  newFromId = targetPlayer.id;
                }
              }

              if (props.updateObject) {
                props.updateObject(obj.id, {
                  from_x: realFx,
                  from_y: realFy,
                  from_id: newFromId,
                });
              }
            }}
            onMouseEnter={(e: any) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'crosshair';
              e.target.scale({ x: 1.3, y: 1.3 });
            }}
            onMouseLeave={(e: any) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'default';
              e.target.scale({ x: 1, y: 1 });
            }}
          />

          {/* END HANDLE */}
          <Circle
            x={positions.toCanvas.x}
            y={positions.toCanvas.y}
            radius={7}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            shadowBlur={4}
            shadowColor="rgba(0,0,0,0.3)"
            onDragStart={(e) => {
              e.cancelBubble = true;
              if (props.onDragStart) props.onDragStart(obj.id);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'crosshair';
              updateLineVisuals(
                positions.fromCanvas,
                positions.bendCanvas,
                { x: e.target.x(), y: e.target.y() },
                'to'
              );
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'default';

              e.target.x(0);
              e.target.y(0);

              const pointer = stage?.getPointerPosition();
              if (!pointer) return;
              const transform = stage?.getAbsoluteTransform().copy().invert();
              const pCanvas = transform?.point(pointer);
              if (!pCanvas) return;

              const realTx = (pCanvas.x / stageWidth) * 100;
              const realTy = (pCanvas.y / stageHeight) * 100;

              let newToId: string | undefined = undefined;
              if (allObjects) {
                const targetPlayer = allObjects.find((o) => {
                  if (o.type !== 'player' && o.type !== 'goalkeeper') return false;
                  const dist = Math.hypot(o.x - realTx, o.y - realTy);
                  return dist < 4.0;
                });
                if (targetPlayer) {
                  newToId = targetPlayer.id;
                }
              }

              if (props.updateObject) {
                props.updateObject(obj.id, {
                  to_x: realTx,
                  to_y: realTy,
                  to_id: newToId,
                });
              }
            }}
            onMouseEnter={(e: any) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'crosshair';
              e.target.scale({ x: 1.3, y: 1.3 });
            }}
            onMouseLeave={(e: any) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'default';
              e.target.scale({ x: 1, y: 1 });
            }}
          />
        </>
      )}
    </Group>
  );
});
ArrowRenderer.displayName = 'ArrowRenderer';

// ---------- Zone / Shape ----------
type AnyZone = ZoneObject | ShapeObject;

export const ZoneRenderer: React.FC<BaseRenderProps<AnyZone>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onTransformEnd, onClick }) => {
    // We render zones centered at obj.x + width/2, obj.y + height/2 
    // BUT the store stores 'x, y' as the top-left for rect-compatibility.
    // Let's stick to 'x, y' being the center for more natural tactical rotation.
    // However, the factory starts them with x,y as top-left.
    
    // To fix "jumping", we calculate the center from the top-left and size.
    const centerX = obj.x + (obj.width / 2);
    const centerY = obj.y + (obj.height / 2);

    const { cx, cy } = pitchToCanvas(centerX, centerY, stageWidth, stageHeight);
    const w = (obj.width / 100) * stageWidth;
    const h = (obj.height / 100) * stageHeight;
    const shapeType = obj.shape_type || 'rect';

    const renderShape = () => {
      const commonShapeProps = {
        fill: obj.fill_color,
        opacity: obj.fill_opacity,
        stroke: obj.stroke_color,
        strokeWidth: obj.type === 'zone' ? 1.5 : 2,
        dash: obj.type === 'zone' ? [8, 4] : undefined,
        hitStrokeWidth: 20, // Easier selection even if fill is low opacity
      };

      switch (shapeType) {
        case 'circle':
          return (
            <Ellipse
              radiusX={w / 2}
              radiusY={h / 2}
              fill={commonShapeProps.fill}
              opacity={commonShapeProps.opacity}
              stroke={commonShapeProps.stroke}
              strokeWidth={commonShapeProps.strokeWidth}
              dash={commonShapeProps.dash}
              hitStrokeWidth={commonShapeProps.hitStrokeWidth}
            />
          );
        case 'triangle':
          return (
            <Line
              points={[0, -h/2, w/2, h/2, -w/2, h/2]}
              closed
              fill={commonShapeProps.fill}
              opacity={commonShapeProps.opacity}
              stroke={commonShapeProps.stroke}
              strokeWidth={commonShapeProps.strokeWidth}
              dash={commonShapeProps.dash}
              hitStrokeWidth={commonShapeProps.hitStrokeWidth}
            />
          );
        case 'rect':
        default:
          return (
            <Rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              cornerRadius={obj.type === 'shape' ? 4 : 0}
              fill={commonShapeProps.fill}
              opacity={commonShapeProps.opacity}
              stroke={commonShapeProps.stroke}
              strokeWidth={commonShapeProps.strokeWidth}
              dash={commonShapeProps.dash}
              hitStrokeWidth={commonShapeProps.hitStrokeWidth}
            />
          );
      }
    };

    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={(obj as any)._opacity ?? 1}
        draggable={!obj.locked}
        onDragEnd={(e) => {
          const newCX = e.target.x();
          const newCY = e.target.y();
          const topLeftX = newCX - w / 2;
          const topLeftY = newCY - h / 2;
          onDragEnd(obj.id, topLeftX, topLeftY);
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          node.scaleX(1);
          node.scaleY(1);

          if (onTransformEnd) {
            onTransformEnd(obj.id, {
              rotation: Math.round(node.rotation()),
              width: (obj.width * scaleX),
              height: (obj.height * scaleY),
            });
          }
        }}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={() => onClick(obj.id, false)}
        id={obj.id}
      >
        {renderShape()}
        
        {isSelected && (
          <Rect
            x={-w / 2 - 4}
            y={-h / 2 - 4}
            width={w + 8}
            height={h + 8}
            stroke="#eab308"
            strokeWidth={2}
            dash={[6, 3]}
            listening={false}
          />
        )}

        {obj.label && (
          <Text
            text={obj.label}
            fontSize={12}
            fontFamily="Inter, sans-serif"
            fontStyle="bold"
            fill={obj.stroke_color}
            width={w}
            x={-w/2}
            align="center"
            y={-h/2 - 16}
            listening={false}
            shadowBlur={2}
            shadowColor="white"
          />
        )}
      </Group>
    );
  }
);
ZoneRenderer.displayName = 'ZoneRenderer';

// ---------- Text / Callout ----------
type AnyText = TextObject | CalloutObject;

export const TextRenderer: React.FC<BaseRenderProps<AnyText>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onTransformEnd, onClick }) => {
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    const isCallout = obj.type === 'callout';

    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={(obj as any)._opacity ?? 1}
        draggable={!obj.locked}
        onDragEnd={(e) => onDragEnd(obj.id, e.target.x(), e.target.y())}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={() => onClick(obj.id, false)}
        hitStrokeWidth={10}
        id={obj.id}
      >
        {obj.background && (
          <Rect
            width={obj.text.length * obj.font_size * 0.6 + 16}
            height={obj.font_size + 12}
            offsetX={4}
            offsetY={4}
            fill={obj.background}
            cornerRadius={4}
            opacity={0.9}
          />
        )}
        {isCallout && 'callout_number' in obj && obj.callout_number != null && (
          <Circle
            x={-8}
            y={obj.font_size / 2}
            radius={10}
            fill={obj.color}
            listening={false}
          />
        )}
        <Text
          text={obj.text}
          fontSize={obj.font_size}
          fontFamily="Inter, sans-serif"
          fill={obj.color}
        />
        {isSelected && (
          <Rect
            width={obj.text.length * obj.font_size * 0.6 + 20}
            height={obj.font_size + 16}
            offsetX={6}
            offsetY={6}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[4, 2]}
            listening={false}
          />
        )}
      </Group>
    );
  }
);
TextRenderer.displayName = 'TextRenderer';

// ---------- Freehand ----------
export const FreehandRenderer: React.FC<BaseRenderProps<FreehandObject>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onTransformEnd, onClick }) => {
    // Convert pitch-relative points to canvas pixels
    const canvasPoints = (obj.points || []).map((val, i) =>
      i % 2 === 0 ? (val / 100) * stageWidth : (val / 100) * stageHeight
    );

    return (
      <Line
        points={canvasPoints}
        stroke={obj.color}
        strokeWidth={obj.width}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
        hitStrokeWidth={16}
        id={obj.id}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={() => onClick(obj.id, false)}
        opacity={(obj as any)._opacity ?? (isSelected ? 1 : 0.85)}
      />
    );
  }
);
FreehandRenderer.displayName = 'FreehandRenderer';


// ---------- Equipment ----------
type AnyEquipment = ConeObject | LadderObject | MiniGoalObject | MannequinObject;

function getEquipmentColor(type: AnyEquipment['type']): string {
  switch (type) {
    case 'cone': return '#f59e0b';
    case 'ladder': return '#8b5cf6';
    case 'mini_goal': return '#6b7280';
    case 'mannequin': return '#ef4444';
  }
}

export const EquipmentRenderer: React.FC<BaseRenderProps<AnyEquipment>> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected, onDragEnd, onTransformEnd, onClick }) => {
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    const color = obj.color || getEquipmentColor(obj.type);

    const renderEquipmentShape = () => {
      switch (obj.type) {
        case 'cone':
          return (
            <Group y={-6}>
              {/* Shadow */}
              <Ellipse radiusX={10} radiusY={4} y={12} fill="black" opacity={0.3} />
              {/* Cone Body */}
              <RegularPolygon
                sides={3}
                radius={12}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
                shadowBlur={2}
                shadowColor="rgba(0,0,0,0.3)"
                shadowOffsetY={1}
              />
              <Line points={[-6, 4, 6, 4]} stroke="#ffffff" strokeWidth={2} opacity={0.8} />
            </Group>
          );
        case 'ladder':
          return (
            <Group>
              <Rect x={-8} y={-24} width={16} height={48} fill="#ffffff" opacity={0.1} />
              <Line points={[-8, -24, -8, 24]} stroke={color} strokeWidth={2} />
              <Line points={[8, -24, 8, 24]} stroke={color} strokeWidth={2} />
              {[-18, -6, 6, 18].map((ry, i) => (
                <Line key={i} points={[-8, ry, 8, ry]} stroke={color} strokeWidth={2} />
              ))}
            </Group>
          );
        case 'mini_goal':
          return (
            <Group>
              {/* Net area */}
              <Rect x={-15} y={-8} width={30} height={16} fill="#ffffff" opacity={0.15} dash={[2, 2]} stroke="#ffffff" strokeWidth={1} />
              {/* Goalposts */}
              <Line points={[-15, 8, -15, -8, 15, -8, 15, 8]} stroke={color} strokeWidth={3} lineCap="round" lineJoin="round" />
            </Group>
          );
        case 'mannequin':
          return (
            <Group>
              <Ellipse radiusX={14} radiusY={4} y={16} fill="black" opacity={0.3} />
              {/* Shoulders */}
              <Rect x={-12} y={-2} width={24} height={18} fill={color} stroke="#ffffff" strokeWidth={2} cornerRadius={6} />
              {/* Head */}
              <Circle y={-10} radius={7} fill={color} stroke="#ffffff" strokeWidth={2} />
            </Group>
          );
      }
    };

    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={(obj as any)._opacity ?? 1}
        draggable={!obj.locked}
        onDragEnd={(e) => onDragEnd(obj.id, e.target.x(), e.target.y())}
        onTransformEnd={(e) => {
          const node = e.target;
          node.scaleX(1);
          node.scaleY(1);
          if (onTransformEnd) {
            onTransformEnd(obj.id, {
              rotation: Math.round(node.rotation()),
            });
          }
        }}
        onClick={(e) => onClick(obj.id, e.evt.shiftKey)}
        onTap={() => onClick(obj.id, false)}
        hitStrokeWidth={30}
        id={obj.id}
      >
        {/* Selection Ring */}
        {isSelected && (
          <Circle 
            radius={20} 
            stroke="#eab308" 
            strokeWidth={2} 
            dash={[4, 4]}
            opacity={0.8}
            listening={false} 
          />
        )}

        {renderEquipmentShape()}
      </Group>
    );
  }
);
EquipmentRenderer.displayName = 'EquipmentRenderer';
