import React, { useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { pitchToCanvas } from '../canvas/pitchUtils';
import { calculateInitialControlPoint } from '../objects/arrowGeometry';
import { alignObjects, scaleFromCentroid } from './formationUtils';
import { 
  RotateCcw, 
  MoveRight, 
  Spline, 
  ArrowRightLeft, 
  Copy, 
  Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  stageWidth: number;
  stageHeight: number;
  stageOffsetX: number;
  stageOffsetY: number;
  zoom: number;
  panX: number;
  panY: number;
}

export const ContextualActions: React.FC<Props> = ({ stageWidth, stageHeight, stageOffsetX, stageOffsetY, zoom, panX, panY }) => {
  const selectedIds = useEditorStore((s: any) => s.selectedObjectIds);
  const deselectAll = useEditorStore((s: any) => s.deselectAll);
  const selectObjects = useEditorStore((s: any) => s.selectObjects);
  const pushHistory = useEditorStore((s: any) => s.pushHistory);
  
  const activeFrameId = useProjectStore((s: any) => s.activeFrameId);
  const frames = useProjectStore((s: any) => s.frames);
  const updateObject = useProjectStore((s: any) => s.updateObject);
  const deleteObjects = useProjectStore((s: any) => s.deleteObjects);
  const duplicateObjects = useProjectStore((s: any) => s.duplicateObjects);

  const activeSnapshot = useMemo(() => {
    return frames.find((f: any) => f.id === activeFrameId)?.snapshot;
  }, [frames, activeFrameId]);

  const selectedObjects = useMemo(() => {
    if (!activeSnapshot) return [];
    return activeSnapshot.objects.filter((o: any) => selectedIds.includes(o.id));
  }, [activeSnapshot, selectedIds]);

  if (selectedObjects.length === 0) return null;

  // Calculate bounding box in pixels
  const bounds = selectedObjects.reduce((acc: any, obj: any) => {
    let px = obj.x;
    let py = obj.y;
    if ('from_x' in obj && 'to_x' in obj) {
      px = (obj.from_x + obj.to_x) / 2;
      py = (obj.from_y + obj.to_y) / 2;
    }
    const { cx, cy } = pitchToCanvas(px, py, stageWidth, stageHeight);
    return {
      minX: Math.min(acc.minX, cx * zoom + panX + stageOffsetX),
      maxX: Math.max(acc.maxX, cx * zoom + panX + stageOffsetX),
      minY: Math.min(acc.minY, cy * zoom + panY + stageOffsetY),
      maxY: Math.max(acc.maxY, cy * zoom + panY + stageOffsetY),
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const rawTopY = bounds.minY - 48; // 48px above
  const topY = rawTopY < 12 ? bounds.maxY + 16 : rawTopY;

  const isSingleArrow = selectedObjects.length === 1 && ['arrow', 'dashed_arrow', 'curved_arrow', 'dashed_curved'].includes(selectedObjects[0]?.type);
  const arrowObj = isSingleArrow ? selectedObjects[0] : null;

  const handleColorChange = (color: string) => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    selectedIds.forEach((id: string) => {
      const obj = selectedObjects.find((o: any) => o.id === id);
      if (obj && 'fill_color' in obj) updateObject(id, { fill_color: color, outline_color: color });
      if (obj && 'color' in obj) updateObject(id, { color });
    });
  };

  const handleReverse = () => {
    if (!arrowObj || !activeSnapshot) return;
    pushHistory(structuredClone(activeSnapshot));
    updateObject(arrowObj.id, {
      from_x: arrowObj.to_x,
      from_y: arrowObj.to_y,
      to_x: arrowObj.from_x,
      to_y: arrowObj.from_y,
      from_id: arrowObj.to_id,
      to_id: arrowObj.from_id,
    });
  };

  const handleTypeChange = (type: string) => {
    if (!arrowObj || !activeSnapshot) return;
    pushHistory(structuredClone(activeSnapshot));
    updateObject(arrowObj.id, { type });
  };

  const handleDelete = () => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    deleteObjects(selectedIds);
    deselectAll();
  };

  const handleDuplicate = () => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    const dups = duplicateObjects(selectedIds);
    selectObjects(dups.map((d: any) => d.id));
  };

  const handleScale = (sx: number, sy: number) => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    const results = scaleFromCentroid(selectedObjects, sx, sy);
    results.forEach(res => updateObject(res.id, { x: res.x, y: res.y }));
  };

  const handleAlign = (type: any) => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    const results = alignObjects(selectedObjects, type);
    results.forEach(res => updateObject(res.id, { x: res.x, y: res.y }));
  };

  return (
    <div 
      className="absolute z-50 flex items-center gap-1.5 p-1.5 bg-white border border-[#e2e4df] shadow-xl backdrop-blur-md rounded-2xl select-none text-[#1f2421]"
      style={{
        left: `${centerX}px`,
        top: `${topY}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Colors */}
      <div className="flex items-center gap-1.5 px-1 border-r border-[#e2e4df] pr-2">
        {['#15803d', '#2563eb', '#dc2626', '#d97706', '#1f2421'].map(color => (
          <button
            key={color}
            className="w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform"
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>

      {/* Movement & Pass Style Quick Toggles */}
      {isSingleArrow && arrowObj && (() => {
        const isPass = arrowObj.intent === 'pass';
        const isCurved = arrowObj.type === 'curved_arrow' || arrowObj.type === 'dashed_curved';
        
        const toggleCurve = () => {
          if (!activeSnapshot) return;
          pushHistory(structuredClone(activeSnapshot));
          if (isCurved) {
            updateObject(arrowObj.id, {
              type: isPass ? 'dashed_arrow' : 'arrow',
              bend_x: null,
              bend_y: null
            });
          } else {
            const ctrl = calculateInitialControlPoint(
              { x: arrowObj.from_x, y: arrowObj.from_y },
              { x: arrowObj.to_x, y: arrowObj.to_y },
              8
            );

            updateObject(arrowObj.id, {
              type: isPass ? 'dashed_curved' : 'curved_arrow',
              bend_x: ctrl.x,
              bend_y: ctrl.y
            });
          }
        };

        return (
          <div className="flex items-center gap-1 px-1 border-r border-[#e2e4df] pr-2">
            <button
              onClick={toggleCurve}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 border",
                isCurved
                  ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]"
                  : "bg-white text-[#5c635e] border-[#e2e4df] hover:text-[#1f2421]"
              )}
              title={isCurved ? "Straighten Pass / Movement" : "Curve Pass / Movement"}
            >
              <Spline className="w-3 h-3" />
              <span>{isCurved ? "Curved" : "Straight"}</span>
            </button>
            <button
              onClick={handleReverse}
              className="p-1 text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] rounded-lg transition-all"
              title={isPass ? "Swap Passer / Receiver" : "Reverse Direction (R)"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Alignment (Only if 2+) */}
      {selectedIds.length > 1 && (
        <div className="flex items-center gap-1 px-1 border-r border-[#e2e4df] pr-2">
          <button className="p-1 hover:bg-[#f4f5f1] rounded text-[#5c635e]" onClick={() => handleAlign('center')} title="Align Horizontal Center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><rect x="6" y="9" width="12" height="6" rx="1"/></svg>
          </button>
          <button className="p-1 hover:bg-[#f4f5f1] rounded text-[#5c635e]" onClick={() => handleAlign('middle')} title="Align Vertical Middle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/><rect x="9" y="6" width="6" height="12" rx="1"/></svg>
          </button>
        </div>
      )}

      <button className="p-1.5 hover:bg-[#f4f5f1] rounded-lg transition-colors text-[#5c635e] hover:text-[#1f2421]" onClick={handleDuplicate} title="Duplicate (Ctrl+D)">
        <Copy className="w-3.5 h-3.5" />
      </button>

      <button className="p-1.5 hover:bg-red-50 text-[#5c635e] hover:text-red-600 rounded-lg transition-colors" onClick={handleDelete} title="Delete (Delete/Backspace)">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

