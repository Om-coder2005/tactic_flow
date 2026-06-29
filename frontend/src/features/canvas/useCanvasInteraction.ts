import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { handleToolPlacement, createPlayer, createGoalkeeper } from '@/features/objects/objectFactories';
import { canvasToPitch, pitchToCanvas, clampPitch } from '@/features/canvas/pitchUtils';
import { usePlaybackStore } from '@/stores/playbackStore';
import type { TacticalObject, ArrowObject, DashedArrowObject, ZoneObject, FreehandObject, PlayerObject, GoalkeeperObject } from '@/types';

export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function useCanvasInteraction(
  stageRef: React.RefObject<Konva.Stage>,
  stageWidth: number,
  stageHeight: number
) {
  const [draftObject, setDraftObject] = useState<TacticalObject | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const drawOrigin = useRef<{ x: number; y: number } | null>(null);
  const isErasing = useRef(false);
  const hasPushedEraserHistory = useRef(false);

  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const selectObjects = useEditorStore((s) => s.selectObjects);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  
  const snapToGridEnabled = useEditorStore((s) => s.snapToGridEnabled);
  
  const getPitchPointerPosition = (): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    const pitchPos = canvasToPitch(pos.x, pos.y, stageWidth, stageHeight);
    
    if (snapToGridEnabled) {
      return {
        x: Math.round(pitchPos.x),
        y: Math.round(pitchPos.y),
      };
    }
    return pitchPos;
  };

  const commitDraft = useCallback((obj: TacticalObject) => {
    const state = useProjectStore.getState();
    const snap = state.getActiveSnapshot();
    if (!snap) return;

    // Magnetism Snap Check for Arrows
    const isArrowType = ['arrow', 'dashed_arrow', 'curved_arrow', 'dashed_curved'].includes(obj.type);
    if (isArrowType) {
      const arr = obj as ArrowObject;
      const others = snap.objects;
      
      // Helper to find nearest player/GK
      const findNearest = (px: number, py: number) => {
        return others.find(o => {
          if (o.type !== 'player' && o.type !== 'goalkeeper') return false;
          const dist = Math.sqrt(Math.pow(o.x - px, 2) + Math.pow(o.y - py, 2));
          return dist < 3.5; // Snap threshold: 3.5% of pitch
        });
      };

      const startSnap = findNearest(arr.from_x, arr.from_y);
      if (startSnap) arr.from_id = startSnap.id;

      const endSnap = findNearest(arr.to_x, arr.to_y);
      if (endSnap) arr.to_id = endSnap.id;
    }

    pushHistory(structuredClone(snap));
    state.addObject(obj);
  }, [pushHistory]);

  const onPointerDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = getPitchPointerPosition();
    if (!pos) return;

    // --- CASE 0: Formation Placement ---
    const previewFormation = useEditorStore.getState().previewFormation;
    if (previewFormation) {
      const { nodes, team } = previewFormation;
      const isAway = team === 'away';
      
      // Calculate center of template to offset relative to cursor
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const updates: { id: string; updates: any }[] = [];
      const projectState = useProjectStore.getState();
      const snap = projectState.getActiveSnapshot();
      if (!snap) return;

      const existingPlayers = snap.objects.filter(o => 
        (o.type === 'player' || o.type === 'goalkeeper') && (o as PlayerObject | GoalkeeperObject).team === team
      );

      // If we have existing players, rearrange them animatedly
      if (existingPlayers.length > 0) {
        const gkNode = nodes.find(n => n.role === 'GK');
        const otherNodes = nodes.filter(n => n.role !== 'GK');
        const gkPlayer = existingPlayers.find(p => p.type === 'goalkeeper');
        const otherPlayers = existingPlayers.filter(p => p.type !== 'goalkeeper');

        if (gkPlayer && gkNode) {
          updates.push({
            id: gkPlayer.id,
            updates: { 
              x: clampPitch(pos.x + (isAway ? -(gkNode.x - centerX) : (gkNode.x - centerX))), 
              y: clampPitch(pos.y + (gkNode.y - centerY)) 
            }
          });
        }

        otherPlayers.sort((a, b) => a.y - b.y || a.x - b.x);
        otherNodes.sort((a, b) => a.y - b.y || a.x - b.x);

        otherPlayers.forEach((p, i) => {
          // eslint-disable-next-line security/detect-object-injection
          const node = otherNodes[i];
          if (node) {
            updates.push({
              id: p.id,
              updates: { 
                x: clampPitch(pos.x + (isAway ? -(node.x - centerX) : (node.x - centerX))), 
                y: clampPitch(pos.y + (node.y - centerY)),
                label: node.role 
              }
            });
          }
        });

        // Use the animation store we built earlier!
        usePlaybackStore.getState().animateObjectUpdates(updates);
      } else {
        // Add new players at the clicked location
        nodes.forEach(node => {
          const relX = node.x - centerX;
          const relY = node.y - centerY;
          const finalX = clampPitch(pos.x + (isAway ? -relX : relX));
          const finalY = clampPitch(pos.y + relY);
          
          const obj = node.role === 'GK' ? createGoalkeeper(finalX, finalY, team) : createPlayer(finalX, finalY, team);
          if (node.role !== 'GK') obj.label = node.role;
          projectState.addObject(obj);
        });
      }

      useEditorStore.getState().setPreviewFormation(null);
      return;
    }

    // --- CASE 1: Rubber-band Selection ---
    if (activeTool === 'select') {
      const stage = stageRef.current;
      if (stage) {
        // We need relative pointer position for selection rect rendering (matches stage local coords)
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        const stagePos = transform.point(pointer);
        if (stagePos) {
          setSelectionRect({
            x1: stagePos.x,
            y1: stagePos.y,
            x2: stagePos.x,
            y2: stagePos.y,
          });
        }
      }
      if (!e.evt.shiftKey) {
        selectObjects([]);
      }
      return;
    }

    if (activeTool === 'eraser') {
      isErasing.current = true;
      hasPushedEraserHistory.current = false;
      const target = e.target;
      if (target && target !== target.getStage() && target.name() !== 'pitch-bg') {
        const id = target.id();
        if (id) {
          const snap = useProjectStore.getState().getActiveSnapshot();
          if (snap) pushHistory(structuredClone(snap));
          hasPushedEraserHistory.current = true;
          useProjectStore.getState().deleteObjects([id]);
        }
      }
      return;
    }
    
    // --- CASE 2: Drawing Tools ---
    const isDragTool = ['arrow', 'dashed_arrow', 'curved_arrow', 'dashed_curved', 'zone', 'shape', 'pencil'].includes(activeTool);
    const initialObj = handleToolPlacement(activeTool, pos.x, pos.y);
    if (!initialObj) return;

    const isArrowType = ['arrow', 'dashed_arrow', 'curved_arrow', 'dashed_curved'].includes(activeTool);

    if (isDragTool) {
      if (isArrowType) {
        const snap = useProjectStore.getState().getActiveSnapshot();
        if (snap) {
          const nearest = snap.objects.find(o => {
            if (o.type !== 'player' && o.type !== 'goalkeeper') return false;
            const dist = Math.sqrt(Math.pow(o.x - pos.x, 2) + Math.pow(o.y - pos.y, 2));
            return dist < 3.5;
          });
          if (nearest) {
            (initialObj as any).from_id = nearest.id;
            (initialObj as any).from_x = nearest.x;
            (initialObj as any).from_y = nearest.y;
          }
        }
      }
      setDraftObject(initialObj);
      drawOrigin.current = { x: pos.x, y: pos.y };
    } else {
      commitDraft(initialObj);
      selectObjects([initialObj.id]);
      setTool('select');
    }
  }, [activeTool, stageWidth, stageHeight, commitDraft, selectObjects, setTool]);

  const onPointerMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = getPitchPointerPosition();
    if (!pos) return;
    setPointerPos(pos);

    // --- Drag to Erase ---
    if (activeTool === 'eraser' && isErasing.current) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        const pointerPos = transform.point(pointer);
        if (pointerPos) {
          const target = stage.getIntersection(pointerPos);
          if (target && target.getStage() !== (target as any) && target.name() !== 'pitch-bg') {
            const id = target.id();
            if (id) {
              if (!hasPushedEraserHistory.current) {
                const snap = useProjectStore.getState().getActiveSnapshot();
                if (snap) pushHistory(structuredClone(snap));
                hasPushedEraserHistory.current = true;
              }
              useProjectStore.getState().deleteObjects([id]);
            }
          }
        }
      }
      return;
    }

    // --- Update Selection Rect ---
    if (selectionRect) {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!stage || !pointer) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const stagePos = transform.point(pointer);
      if (stagePos) {
        setSelectionRect((prev) => prev ? { ...prev, x2: stagePos.x, y2: stagePos.y } : null);
      }
      return;
    }

    // --- Update Drawing Draft ---
    if (!draftObject) return;

    setDraftObject((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };

      const isArrowType = ['arrow', 'dashed_arrow', 'curved_arrow', 'dashed_curved'].includes(copy.type);
      if (isArrowType) {
        const arr = copy as ArrowObject | DashedArrowObject;
        
        // Real-time Magnetism Snap
        const snap = useProjectStore.getState().getActiveSnapshot();
        if (snap) {
          const nearest = snap.objects.find(o => {
            if (o.type !== 'player' && o.type !== 'goalkeeper') return false;
            const dist = Math.sqrt(Math.pow(o.x - pos.x, 2) + Math.pow(o.y - pos.y, 2));
            return dist < 3.5;
          });
          
          if (nearest) {
            arr.to_id = nearest.id;
            arr.to_x = nearest.x;
            arr.to_y = nearest.y;
          } else {
            arr.to_id = undefined;
            arr.to_x = pos.x;
            arr.to_y = pos.y;
          }
        }
      } else if (copy.type === 'zone' || copy.type === 'shape') {
        const zone = copy as ZoneObject;
        const origin = drawOrigin.current;
        if (origin) {
          zone.width = Math.abs(pos.x - origin.x);
          zone.height = Math.abs(pos.y - origin.y);
          zone.x = Math.min(pos.x, origin.x);
          zone.y = Math.min(pos.y, origin.y);
        }
      } else if (copy.type === 'freehand') {
        const fh = copy as FreehandObject;
        fh.points = [...fh.points, pos.x, pos.y];
      }

      return copy;
    });
  }, [draftObject, selectionRect, stageWidth, stageHeight]);

  const onPointerUp = useCallback(() => {
    if (activeTool === 'eraser') {
      isErasing.current = false;
      hasPushedEraserHistory.current = false;
    }

    // --- Commit Selection ---
    if (selectionRect) {
      const { x1, y1, x2, y2 } = selectionRect;
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x1 - x2);
      const h = Math.abs(y1 - y2);

      const objects = useProjectStore.getState().getActiveSnapshot()?.objects || [];
      const selectedIds = objects.filter(obj => {
        let objX1 = obj.x;
        let objY1 = obj.y;
        let objX2 = obj.x;
        let objY2 = obj.y;

        if ('from_x' in obj && 'to_x' in obj) {
          objX1 = Math.min((obj as any).from_x, (obj as any).to_x);
          objX2 = Math.max((obj as any).from_x, (obj as any).to_x);
          objY1 = Math.min((obj as any).from_y, (obj as any).to_y);
          objY2 = Math.max((obj as any).from_y, (obj as any).to_y);
        } else if ('width' in obj && 'height' in obj) {
          objX2 = obj.x + (obj as any).width;
          objY2 = obj.y + (obj as any).height;
        } else {
          // Standard point object (player, ball) - give it a radius bounding box (approx 3% of pitch)
          objX1 = obj.x - 3;
          objX2 = obj.x + 3;
          objY1 = obj.y - 3;
          objY2 = obj.y + 3;
        }

        const p1 = pitchToCanvas(objX1, objY1, stageWidth, stageHeight);
        const p2 = pitchToCanvas(objX2, objY2, stageWidth, stageHeight);
        
        const canvasObjX1 = Math.min(p1.cx, p2.cx);
        const canvasObjY1 = Math.min(p1.cy, p2.cy);
        const canvasObjX2 = Math.max(p1.cx, p2.cx);
        const canvasObjY2 = Math.max(p1.cy, p2.cy);

        // Rect overlap test
        return !(canvasObjX2 < x || canvasObjX1 > x + w || canvasObjY2 < y || canvasObjY1 > y + h);
      }).map(o => o.id);

      selectObjects(selectedIds);
      setSelectionRect(null);
      return;
    }

    // --- Commit Draft ---
    if (draftObject) {
      commitDraft(draftObject);
      setDraftObject(null);
      drawOrigin.current = null;
      selectObjects([draftObject.id]);
      setTool('select');
    }
  }, [draftObject, selectionRect, commitDraft, selectObjects, setTool, stageWidth, stageHeight]);

  return {
    draftObject,
    selectionRect,
    pointerPos,
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}
