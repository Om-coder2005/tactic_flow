import React, { useCallback } from 'react';
import { Group, Circle, Rect, RegularPolygon, Text, Ring } from 'react-konva';
import { pitchToCanvas } from '@/features/canvas/pitchUtils';
import type { PlayerObject, GoalkeeperObject } from '@/types';

interface Props {
  obj: PlayerObject | GoalkeeperObject;
  stageWidth: number;
  stageHeight: number;
  isSelected?: boolean;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, cx: number, cy: number) => void;
  onDragEnd?: (id: string, cx: number, cy: number) => void;
  onTransformEnd?: (id: string, updates: any) => void;
  onClick?: (id: string, shiftKey: boolean) => void;
  isGhost?: boolean;
}

const BASE_NODE_RADIUS = 16;
const BASE_INNER_RADIUS = 12;
const BASE_LABEL_FONT_SIZE = 10;

export const PlayerNode: React.FC<Props> = React.memo(
  ({ obj, stageWidth, stageHeight, isSelected = false, onDragStart, onDragMove, onDragEnd, onTransformEnd, onClick, isGhost = false }) => {
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    const scaleFactor = Math.max(0.9, Math.min(1.15, stageWidth / 900));
    const nodeRadius = BASE_NODE_RADIUS * scaleFactor;
    const innerRadius = BASE_INNER_RADIUS * scaleFactor;
    const labelFontSize = BASE_LABEL_FONT_SIZE * scaleFactor;

    const handleDragStart = useCallback(() => {
      onDragStart?.(obj.id);
    }, [obj.id, onDragStart]);

    const handleDragMove = useCallback(
      (e: { target: { x: () => number; y: () => number } }) => {
        onDragMove?.(obj.id, e.target.x(), e.target.y());
      },
      [obj.id, onDragMove]
    );

    const handleDragEnd = useCallback(
      (e: { target: { x: () => number; y: () => number } }) => {
        onDragEnd?.(obj.id, e.target.x(), e.target.y());
      },
      [obj.id, onDragEnd]
    );

    const handleTransformEnd = useCallback(
      (e: any) => {
        const node = e.target;
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd?.(obj.id, {
          rotation: Math.round(node.rotation()),
        });
      },
      [obj.id, onTransformEnd]
    );

    const handleClick = useCallback(
      (e: any) => {
        onClick?.(obj.id, e.evt.shiftKey);
      },
      [obj.id, onClick]
    );

    const isGK = obj.type === 'goalkeeper';
    const displayText = obj.number || (obj.label ? obj.label.slice(0, 3) : '');
    const strokeWidth = isSelected ? 4 : 2;
    const shadowOpacity = isGhost ? 0 : 0.2;

    return (
      <Group
        x={cx}
        y={cy}
        rotation={obj.rotation ?? 0}
        opacity={isGhost ? 0.4 : ((obj as any)._opacity ?? 1)}
        draggable={!isGhost && !obj.locked}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}
        onTap={handleClick}
        listening={!isGhost}
        hitStrokeWidth={20}
        id={obj.id}
      >
        {/* Drop Shadow (Material Feel) */}
        {!isGhost && (
          <Circle
            radius={nodeRadius}
            fill="black"
            opacity={0.15}
            offsetY={-3}
            shadowBlur={isSelected ? 10 : 5}
            listening={false}
          />
        )}

        {/* Selection Ring (Animated feel) */}
        {isSelected && (
          <Ring
            innerRadius={nodeRadius + 3}
            outerRadius={nodeRadius + 6}
            fill="#eab308"
            opacity={0.8}
            shadowBlur={8}
            shadowColor="#eab308"
            listening={false}
          />
        )}

        {/* Main Body */}
        {obj.style === 'circle' && (
          <Circle
            radius={nodeRadius}
            fill={obj.fill_color}
            stroke={obj.outline_color}
            strokeWidth={strokeWidth}
            shadowBlur={isSelected ? 4 : 0}
            shadowColor="rgba(0,0,0,0.5)"
          />
        )}
        {obj.style === 'square' && (
          <Rect
            width={nodeRadius * 2}
            height={nodeRadius * 2}
            offsetX={nodeRadius}
            offsetY={nodeRadius}
            fill={obj.fill_color}
            stroke={obj.outline_color}
            strokeWidth={strokeWidth}
            cornerRadius={6}
          />
        )}
        {obj.style === 'diamond' && (
          <RegularPolygon
            sides={4}
            radius={nodeRadius * 1.1}
            fill={obj.fill_color}
            stroke={obj.outline_color}
            strokeWidth={strokeWidth}
          />
        )}

        {/* Inner Ring (Retro Detail) */}
        <Circle
          radius={innerRadius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          listening={false}
        />

        {/* Number / Label */}
        <Text
          text={displayText}
          fontSize={labelFontSize}
          fontFamily="'Outfit', 'Inter', sans-serif"
          fontStyle="900"
          fill={isDarkColor(obj.fill_color) ? '#ffffff' : '#0f172a'}
          align="center"
          verticalAlign="middle"
          width={nodeRadius * 2}
          height={nodeRadius * 2}
          offsetX={nodeRadius}
          offsetY={nodeRadius}
          listening={false}
          shadowBlur={1}
          shadowColor="rgba(0,0,0,0.2)"
        />

        {/* Role Badge (If label is long) */}
        {obj.label && obj.label.length > 0 && (
          <Group y={nodeRadius + 8}>
             <Rect
                width={36}
                height={12}
                offsetX={18}
                fill={obj.fill_color}
                stroke={obj.outline_color}
                strokeWidth={1}
                cornerRadius={3}
                shadowBlur={2}
                opacity={0.9}
             />
             <Text
                text={obj.label.toUpperCase()}
                fontSize={7}
                fontFamily="Inter, sans-serif"
                fontStyle="900"
                fill={isDarkColor(obj.fill_color) ? '#ffffff' : '#0f172a'}
                align="center"
                width={36}
                offsetX={18}
                y={2.5}
             />
          </Group>
        )}

        {/* Lock Icon Indicator */}
        {obj.locked && (
          <Circle
            x={nodeRadius - 4}
            y={-nodeRadius + 4}
            radius={6}
            fill="#eab308"
            stroke="#0f172a"
            strokeWidth={1.5}
            listening={false}
          />
        )}
      </Group>
    );
  }
);

function isDarkColor(hex: string) {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

PlayerNode.displayName = 'PlayerNode';
