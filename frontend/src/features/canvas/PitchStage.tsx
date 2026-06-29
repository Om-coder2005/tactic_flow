// ============================================
// TacticFlow — Pitch Stage
// Top-level Konva Stage with background + content layers
// ============================================

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Transformer, Group, Text as KonvaText } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { getPitchDimensions, pitchToCanvas, canvasToPitch, clampPitch } from './pitchUtils';
import { useCanvasInteraction } from './useCanvasInteraction';
import { PlayerNode } from '@/features/objects/PlayerNode';
import { type FormationNodeDef } from '@/features/formations/prebuiltFormations';
import { 
  BallMarker, 
  ArrowRenderer, 
  ZoneRenderer, 
  TextRenderer, 
  FreehandRenderer, 
  EquipmentRenderer 
} from '@/features/objects/ObjectRenderers';
import { ContextualActions } from './ContextualActions';
import { SpotlightOverlay } from './SpotlightOverlay';
import { cn } from '@/lib/utils';
import type { TacticalObject, ZoneObject } from '@/types';
import type Konva from 'konva';

// Pitch line drawing constants
const LINE_COLOR_MAP = {
  classic_green: '#ffffff',
  tactical_dark: '#4a5568',
  minimal: '#d1d5db',
  wc_qatar: '#f3c46b', // Qatar desert gold lines
  wc_brasil: '#fed100', // Brasil samba yellow lines
  wc_classic: '#f5f2eb', // Classic Mexico cream lines
  wc_russia: '#ffd700', // Russia gold lines
} as const;

const BG_COLOR_MAP = {
  classic_green: '#2d8a4e',
  tactical_dark: '#1a1a2e',
  minimal: '#fafafa',
  wc_qatar: '#5c0632', // Qatar burgundy
  wc_brasil: '#007a33', // Brasil green
  wc_classic: '#436d4e', // Retro warm olive green
  wc_russia: '#8a111a', // Russia ruby crimson red
} as const;

export const PitchStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 518 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Editor state — individual selectors to avoid re-renders
  const pitchTheme = useEditorStore((s: any) => s.pitchTheme);
  const activeTool = useEditorStore((s: any) => s.activeTool);
  const selectedObjectIds = useEditorStore((s: any) => s.selectedObjectIds);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const previewFormation = useEditorStore((s: any) => s.previewFormation);
  const spotlightEnabled = useEditorStore((s: any) => s.spotlightEnabled);
  const isPresenting = useEditorStore((s: any) => s.isPresenting);
  const zoom = useEditorStore((s: any) => s.zoom);
  const panX = useEditorStore((s: any) => s.panX);
  const panY = useEditorStore((s: any) => s.panY);

  // Playback overrides
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const interpolatedObjects = usePlaybackStore((s) => s.interpolatedObjects);

  // Project state
  const activeSnapshot = useProjectStore((s: any) => {
    const frame = s.frames.find((f: any) => f.id === s.activeFrameId);
    return frame?.snapshot ?? null;
  });
  
  const updateObject = useProjectStore((s: any) => s.updateObject);
  const selectObjects = useEditorStore((s: any) => s.selectObjects);
  const addToSelection = useEditorStore((s: any) => s.addToSelection);
  const pushHistory = useEditorStore((s: any) => s.pushHistory);

  // Hook up drawing interactions
  const { draftObject, selectionRect, pointerPos, onPointerDown, onPointerMove, onPointerUp } = useCanvasInteraction(
    stageRef,
    stageSize.width,
    stageSize.height
  );

  const transformerRef = useRef<Konva.Transformer>(null);

  // Sync Transformer nodes with selection
  useEffect(() => {
    if (!transformerRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    const nodes = selectedObjectIds
      .map((id: string) => stage.findOne((node: any) => node.id() === id))
      .filter(Boolean);

    transformerRef.current.nodes(nodes);
  }, [selectedObjectIds]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
      const dims = getPitchDimensions(width, height);
      setStageSize(dims);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Register active frame export callback for the ExportModal
  useEffect(() => {
    (window as any).__exportActiveFrame = () => {
      if (!stageRef.current) return null;
      return stageRef.current.toDataURL({ pixelRatio: 2 });
    };
    return () => {
      delete (window as any).__exportActiveFrame;
    };
  }, []);

  // Sorted objects by z_index
  const objects = useMemo(() => {
    let baseObjects = activeSnapshot ? activeSnapshot.objects : [];
    if (isPlaying && interpolatedObjects) {
      baseObjects = interpolatedObjects;
    }
    return [...baseObjects].sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));
  }, [activeSnapshot, isPlaying, interpolatedObjects]);

  const lineColor = LINE_COLOR_MAP[pitchTheme as keyof typeof LINE_COLOR_MAP] || LINE_COLOR_MAP.classic_green;
  const bgColor = BG_COLOR_MAP[pitchTheme as keyof typeof BG_COLOR_MAP] || BG_COLOR_MAP.classic_green;

  // Find the zone to spotlight (first selected zone)
  const spotlightZone = useMemo(() => {
    if (!spotlightEnabled || !isPresenting || selectedObjectIds.length === 0) return null;
    const selected = objects.filter(o => selectedObjectIds.includes(o.id));
    return (selected.find(o => o.type === 'zone') as ZoneObject) || null;
  }, [spotlightEnabled, isPresenting, selectedObjectIds, objects]);

  const handleTransformEnd = (id: string, updates: Partial<TacticalObject>) => {
    if (activeSnapshot) {
      pushHistory(structuredClone(activeSnapshot));
      updateObject(id, updates);
    }
  };

  const handleDragStart = (id: string) => {
    if (activeSnapshot) {
      pushHistory(structuredClone(activeSnapshot));
    }
  };

  const handleDragMove = (id: string, cx: number, cy: number) => {
    const pos = canvasToPitch(cx, cy, stageSize.width, stageSize.height);
    updateObject(id, { x: pos.x, y: pos.y });
  };

  const handleDragEnd = (id: string, cx: number, cy: number) => {
    const pos = canvasToPitch(cx, cy, stageSize.width, stageSize.height);
    updateObject(id, { x: pos.x, y: pos.y });
  };

  const handleClick = (id: string, shiftKey: boolean) => {
    if (shiftKey) {
      addToSelection(id);
    } else {
      selectObjects([id]);
      
      // Bring to front for z-index bug
      const maxZ = Math.max(0, ...objects.map(o => o.z_index ?? 0));
      updateObject(id, { z_index: maxZ + 1 });
    }
  };

  const renderObject = (obj: TacticalObject) => {
    const isSelected = selectedObjectIds.includes(obj.id);
    const commonProps = {
      key: obj.id,
      obj: obj,
      stageWidth: stageSize.width,
      stageHeight: stageSize.height,
      isSelected,
      allObjects: objects,
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onClick: handleClick,
      onTransformEnd: (updates: Partial<TacticalObject>) => handleTransformEnd(obj.id, updates),
      updateObject: updateObject
    };

    switch (obj.type) {
      case 'player':
      case 'goalkeeper':
        return <PlayerNode {...(commonProps as any)} />;
      case 'ball':
        return <BallMarker {...(commonProps as any)} />;
      case 'arrow':
      case 'curved_arrow':
      case 'dashed_arrow':
      case 'dashed_curved':
        return <ArrowRenderer {...(commonProps as any)} />;
      case 'zone':
      case 'shape':
        return <ZoneRenderer {...(commonProps as any)} />;
      case 'text':
      case 'callout':
        return <TextRenderer {...(commonProps as any)} />;
      case 'freehand':
        return <FreehandRenderer {...(commonProps as any)} />;
      case 'cone':
      case 'ladder':
      case 'mini_goal':
      case 'mannequin':
        return <EquipmentRenderer {...(commonProps as any)} />;
      default:
        return null;
    }
  };

  const lw = 2;

  const gridLines = useMemo(() => {
    if (!gridEnabled) return null;
    const lines = [];
    for (let i = 1; i < 10; i++) {
      const x = (i / 10) * stageSize.width;
      lines.push(<Line key={`v-${i}`} points={[x, 0, x, stageSize.height]} stroke={lineColor} strokeWidth={0.5} opacity={0.2} dash={[5, 5]} />);
      const y = (i / 10) * stageSize.height;
      lines.push(<Line key={`h-${i}`} points={[0, y, stageSize.width, y]} stroke={lineColor} strokeWidth={0.5} opacity={0.2} dash={[5, 5]} />);
    }
    return lines;
  }, [gridEnabled, stageSize, lineColor]);

  const zoneOverlays = useMemo(() => {
    if (pitchZoneOverlay === 'none') return null;
    
    const X_MARGIN = 0.02 * stageSize.width;
    const Y_MARGIN = 0.03 * stageSize.height;
    const DRAW_W = stageSize.width - 2 * X_MARGIN;
    const DRAW_H = stageSize.height - 2 * Y_MARGIN;
    
    // Horizontal pitch -> X axis is length (105), Y axis is width (68)
    const mToX = (m: number) => X_MARGIN + (m / 105) * DRAW_W;
    const mToY = (m: number) => Y_MARGIN + (m / 68) * DRAW_H;
    
    const overlays = [];
    const lw = 2;
    if (pitchZoneOverlay === 'thirds') {
      const x1 = mToX(35);
      const x2 = mToX(70);
      overlays.push(<Line key="t1" points={[x1, Y_MARGIN, x1, Y_MARGIN + DRAW_H]} stroke={lineColor} strokeWidth={lw} opacity={0.3} dash={[10, 5]} />);
      overlays.push(<Line key="t2" points={[x2, Y_MARGIN, x2, Y_MARGIN + DRAW_H]} stroke={lineColor} strokeWidth={lw} opacity={0.3} dash={[10, 5]} />);
      const labelW = DRAW_W / 3;
      overlays.push(
        <KonvaText key="lbl-t1" x={X_MARGIN + labelW/2 - 60} y={Y_MARGIN + 8} width={120} text="DEFENSIVE THIRD" fontSize={11} fontStyle="bold" fill={lineColor} opacity={0.35} align="center" />
      );
      overlays.push(
        <KonvaText key="lbl-t2" x={x1 + labelW/2 - 60} y={Y_MARGIN + 8} width={120} text="MIDDLE THIRD" fontSize={11} fontStyle="bold" fill={lineColor} opacity={0.35} align="center" />
      );
      overlays.push(
        <KonvaText key="lbl-t3" x={x2 + labelW/2 - 60} y={Y_MARGIN + 8} width={120} text="ATTACKING THIRD" fontSize={11} fontStyle="bold" fill={lineColor} opacity={0.35} align="center" />
      );
    } 

    if (pitchZoneOverlay === '5_vertical_lanes') {
      const y1 = mToY(13.85); // Top of penalty box
      const y2 = mToY(68 - 13.85); // Bottom of penalty box
      const y1a = mToY(13.85 + 13.43);
      const y2a = mToY(68 - 13.85 - 13.43);
      const startX = mToX(0);
      const endX = mToX(105);

      [y1, y1a, y2a, y2].forEach((y, i) => {
        overlays.push(<Line key={`fl-${i}`} points={[startX, y, endX, y]} stroke={lineColor} strokeWidth={lw} opacity={0.3} dash={[10, 5]} />);
      });
    }

    if (pitchZoneOverlay === '18_zones') {
      const startX = mToX(0);
      const endX = mToX(105);
      
      // 3 vertical sections (2 horizontal lines)
      const y1 = mToY(68 / 3);
      const y2 = mToY((68 / 3) * 2);
      [y1, y2].forEach((y, i) => {
        overlays.push(<Line key={`18z-h-${i}`} points={[startX, y, endX, y]} stroke={lineColor} strokeWidth={lw} opacity={0.3} dash={[10, 5]} />);
      });

      // 6 horizontal sections (5 vertical lines)
      for (let i = 1; i < 6; i++) {
        const x = mToX((105 / 6) * i);
        overlays.push(<Line key={`18z-v-${i}`} points={[x, Y_MARGIN, x, Y_MARGIN + DRAW_H]} stroke={lineColor} strokeWidth={lw} opacity={0.3} dash={[10, 5]} />);
      }
    }

    return overlays;
  }, [pitchZoneOverlay, stageSize, lineColor]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center overflow-hidden transition-colors duration-500", isPresenting ? "bg-black" : "bg-surface-100 dark:bg-surface-950")}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="cursor-default"
        style={{
          cursor: activeTool === 'select' ? 'default' : 'crosshair',
        }}
      >
        <Layer listening={false}>
          <Rect
            name="pitch-bg"
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            fill={bgColor}
            cornerRadius={4}
          />
          <PitchMarkings width={stageSize.width} height={stageSize.height} lineColor={lineColor} />
          {gridLines}
          {zoneOverlays}
        </Layer>

        <Layer>
          {objects.map(renderObject)}
          {draftObject && renderObject(draftObject)}

          {/* Formation Preview Ghost with Structural Lines */}
          {previewFormation && (() => {
            const { nodes, team } = previewFormation;
            const isAway = team === 'away';

            return (
              <Group opacity={0.6}>
                {/* Ghost nodes */}
                {nodes.map((node: FormationNodeDef, i: number) => {
                  const finalX = isAway ? 100 - node.x : node.x;
                  const finalY = node.y;
                  
                  return (
                    <PlayerNode
                      key={`preview-${i}`}
                      obj={{
                        id: `preview-${i}`,
                        type: node.role === 'GK' ? 'goalkeeper' : 'player',
                        x: finalX,
                        y: finalY,
                        label: node.role !== 'GK' ? node.role : undefined,
                        fill_color: isAway ? '#3b82f6' : '#ef4444',
                        outline_color: '#ffffff',
                        style: 'circle',
                        team: team as any,
                        z_index: 999,
                        locked: false,
                        rotation: 0
                      } as any}
                      stageWidth={stageSize.width}
                      stageHeight={stageSize.height}
                      isSelected={false}
                      isGhost={true}
                    />
                  );
                })}
              </Group>
            );
          })()}

          {selectionRect && (
            <Rect
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x1 - selectionRect.x2)}
              height={Math.abs(selectionRect.y1 - selectionRect.y2)}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeWidth={1}
            />
          )}

          <Transformer
            ref={transformerRef}
            flipEnabled={false}
            centeredScaling={true}
            anchorSize={8}
            anchorCornerRadius={4}
            anchorFill="#eab308"
            anchorStroke="#0f172a"
            borderStroke="#eab308"
            borderDash={[4, 2]}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
              return newBox;
            }}
          />
        </Layer>

        {spotlightEnabled && (
          <SpotlightOverlay
            zone={spotlightZone}
            stageWidth={stageSize.width}
            stageHeight={stageSize.height}
            zoom={zoom}
            panX={panX}
            panY={panY}
            pointerPos={pointerPos}
          />
        )}
      </Stage>

      <ContextualActions 
        stageWidth={stageSize.width} 
        stageHeight={stageSize.height}
        stageOffsetX={containerSize.width > 0 ? (containerSize.width - stageSize.width) / 2 : 0}
        stageOffsetY={containerSize.height > 0 ? (containerSize.height - stageSize.height) / 2 : 0}
        zoom={zoom}
        panX={panX}
        panY={panY}
      />
    </div>
  );
};

// ---- Pitch Markings ----
interface PitchMarkingsProps { width: number; height: number; lineColor: string; }
const PitchMarkings: React.FC<PitchMarkingsProps> = React.memo(({ width, height, lineColor }) => {
  const lw = 2;
  const opacity = 0.85;

  const PITCH_L = 105;
  const PITCH_W = 68;
  const BOX_L = 16.5;
  const BOX_W = 40.32;
  const SIX_L = 5.5;
  const SIX_W = 18.32;
  const CIRCLE_R = 9.15;
  const SPOT_DIST = 11;

  const X_MARGIN = 0.02 * width;
  const Y_MARGIN = 0.03 * height;
  const DRAW_W = width - 2 * X_MARGIN;
  const DRAW_H = height - 2 * Y_MARGIN;

  // Horizontal orientation: X axis is length (105), Y axis is width (68)
  const mToX = (m: number) => X_MARGIN + (m / PITCH_L) * DRAW_W;
  const mToY = (m: number) => Y_MARGIN + (m / PITCH_W) * DRAW_H;
  const distToPx = (m: number) => (m / PITCH_L) * DRAW_W;
  const distToPy = (m: number) => (m / PITCH_W) * DRAW_H;

  return (
    <>
      <Rect x={X_MARGIN} y={Y_MARGIN} width={DRAW_W} height={DRAW_H} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      {/* Halfway line (vertical for horizontal pitch) */}
      <Line points={[mToX(PITCH_L/2), Y_MARGIN, mToX(PITCH_L/2), Y_MARGIN + DRAW_H]} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      <Line points={generateCirclePoints(mToX(PITCH_L/2), mToY(PITCH_W/2), distToPy(CIRCLE_R), 64)} stroke={lineColor} strokeWidth={lw} opacity={opacity} closed listening={false} />
      <Line points={generateCirclePoints(mToX(PITCH_L/2), mToY(PITCH_W/2), 3, 16)} stroke={lineColor} strokeWidth={1} opacity={opacity} fill={lineColor} closed listening={false} />
      
      {/* Left Penalty Box */}
      <Rect x={X_MARGIN} y={mToY((PITCH_W - BOX_W)/2)} width={distToPx(BOX_L)} height={distToPy(BOX_W)} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      <Rect x={X_MARGIN} y={mToY((PITCH_W - SIX_W)/2)} width={distToPx(SIX_L)} height={distToPy(SIX_W)} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      <Line points={generateCirclePoints(mToX(SPOT_DIST), mToY(PITCH_W/2), 3, 16)} stroke={lineColor} strokeWidth={1} opacity={opacity} fill={lineColor} closed listening={false} />
      
      {/* Right Penalty Box */}
      <Rect x={mToX(PITCH_L - BOX_L)} y={mToY((PITCH_W - BOX_W)/2)} width={distToPx(BOX_L)} height={distToPy(BOX_W)} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      <Rect x={mToX(PITCH_L - SIX_L)} y={mToY((PITCH_W - SIX_W)/2)} width={distToPx(SIX_L)} height={distToPy(SIX_W)} stroke={lineColor} strokeWidth={lw} opacity={opacity} listening={false} />
      <Line points={generateCirclePoints(mToX(PITCH_L - SPOT_DIST), mToY(PITCH_W/2), 3, 16)} stroke={lineColor} strokeWidth={1} opacity={opacity} fill={lineColor} closed listening={false} />
    </>
  );
});
PitchMarkings.displayName = 'PitchMarkings';

function generateCirclePoints(cx: number, cy: number, radius: number, segments: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  return points;
}
