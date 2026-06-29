import React, { useState, useEffect } from 'react';
import { Layer, Group, Rect, Circle } from 'react-konva';
import { pitchToCanvas } from './pitchUtils';
import type { ZoneObject } from '@/types';

interface Props {
  zone: ZoneObject | null;
  stageWidth: number;
  stageHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  pointerPos?: { x: number; y: number } | null;
}

export const SpotlightOverlay: React.FC<Props> = ({ 
  zone, stageWidth, stageHeight, zoom, panX, panY, pointerPos 
}) => {
  // We use a Group with 'destination-out' to cut a hole in a dark rectangle
  return (
    <Layer listening={false}>
      <Group>
        {/* Full screen dim - Material Dark Overlay */}
        <Rect
          x={-panX / zoom - 2000}
          y={-panY / zoom - 2000}
          width={(stageWidth / zoom) + 4000}
          height={(stageHeight / zoom) + 4000}
          fill="rgba(15, 23, 42, 0.75)" // surface-900 with high opacity
        />
        
        {/* The "Hole" - Using destination-out */}
        {zone ? (
          <Rect
            x={pitchToCanvas(zone.x, zone.y, stageWidth, stageHeight).cx}
            y={pitchToCanvas(zone.x, zone.y, stageWidth, stageHeight).cy}
            width={(zone.width / 100) * stageWidth}
            height={(zone.height / 100) * stageHeight}
            rotation={zone.rotation ?? 0}
            fill="black"
            globalCompositeOperation="destination-out"
            cornerRadius={6}
            shadowBlur={40}
            shadowColor="black"
          />
        ) : pointerPos ? (
          <Circle
            x={pointerPos.x}
            y={pointerPos.y}
            radius={80}
            fill="black"
            globalCompositeOperation="destination-out"
            shadowBlur={100}
            shadowColor="black"
          />
        ) : null}
      </Group>

      {/* Decorative HUD Circle around the spotlight */}
      {pointerPos && !zone && (
        <Circle
           x={pointerPos.x}
           y={pointerPos.y}
           radius={82}
           stroke="#eab308"
           strokeWidth={1}
           opacity={0.3}
           dash={[10, 5]}
        />
      )}
    </Layer>
  );
};
