import React, { useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { pitchToCanvas } from '../canvas/pitchUtils';
import { alignObjects, scaleFromCentroid } from './formationUtils';

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
    const { cx, cy } = pitchToCanvas(obj.x, obj.y, stageWidth, stageHeight);
    return {
      minX: Math.min(acc.minX, cx * zoom + panX + stageOffsetX),
      maxX: Math.max(acc.maxX, cx * zoom + panX + stageOffsetX),
      minY: Math.min(acc.minY, cy * zoom + panY + stageOffsetY),
      maxY: Math.max(acc.maxY, cy * zoom + panY + stageOffsetY),
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const rawTopY = bounds.minY - 50; // 50px above
  const topY = rawTopY < 12 ? bounds.maxY + 20 : rawTopY;

  const handleColorChange = (color: string) => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
    selectedIds.forEach((id: string) => {
      const obj = selectedObjects.find((o: any) => o.id === id);
      if (obj && 'fill_color' in obj) updateObject(id, { fill_color: color, outline_color: color });
      if (obj && 'color' in obj) updateObject(id, { color });
    });
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
      className="absolute z-50 flex items-center gap-1 p-1 bg-white/95 dark:bg-surface-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-surface-500/50"
      style={{
        left: `${centerX}px`,
        top: `${topY}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Colors */}
      <div className="flex items-center gap-1 px-1 border-r border-surface-200 dark:border-surface-500 mr-1">
        {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#1a1a1a'].map(color => (
          <button
            key={color}
            className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 hover:scale-125 transition-transform"
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>

      {/* Alignment (Only if 2+) */}
      {selectedIds.length > 1 && (
        <div className="flex items-center gap-1 px-1 border-r border-surface-200 dark:border-surface-500 mr-1">
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleAlign('center')} title="Align Horizontal Center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><rect x="6" y="9" width="12" height="6" rx="1"/></svg>
          </button>
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleAlign('middle')} title="Align Vertical Middle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/><rect x="9" y="6" width="6" height="12" rx="1"/></svg>
          </button>
        </div>
      )}

      {/* Width / Depth (Only if 2+) */}
      {selectedIds.length > 1 && (
        <div className="flex items-center gap-1 px-1 border-r border-surface-200 dark:border-surface-500 mr-1">
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleScale(1.1, 1.0)} title="Increase Width">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8L22 12L18 16"/><path d="M6 8L2 12L6 16"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </button>
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleScale(0.9, 1.0)} title="Decrease Width">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 8L3 12L7 16"/><path d="M17 8L21 12L17 16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
          <div className="w-px h-3 bg-surface-200 dark:bg-surface-700 mx-0.5" />
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleScale(1.0, 1.1)} title="Increase Depth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-90"><path d="M18 8L22 12L18 16"/><path d="M6 8L2 12L6 16"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </button>
          <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded text-surface-500" onClick={() => handleScale(1.0, 0.9)} title="Decrease Depth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-90"><path d="M7 8L3 12L7 16"/><path d="M17 8L21 12L17 16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
        </div>
      )}

      <button className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors group" onClick={handleDuplicate} title="Duplicate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-600 dark:text-surface-400 group-hover:text-accent">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>

      <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors group" onClick={handleDelete} title="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-600 dark:text-surface-400 group-hover:text-red-500">
          <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </button>
    </div>
  );
};
