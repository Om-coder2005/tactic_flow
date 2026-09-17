import React, { useMemo, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import type { TacticalObject } from '@/types';
import { AIPanel } from '@/features/ai/AIPanel';
import { ColorPicker } from '@/components/ColorPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Layers, 
  Sparkles,
  Palette,
  Layout,
  Grid3X3,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const RightPanel: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userMode = useEditorStore((s: any) => s.userMode);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);

  const selectedObjectIds = useEditorStore((s: any) => s.selectedObjectIds);
  const activeSnapshot = useProjectStore((s: any) => {
    const frame = s.frames.find((f: any) => f.id === s.activeFrameId);
    return frame?.snapshot ?? null;
  });
  const updateObject = useProjectStore((s: any) => s.updateObject);
  const pushHistory = useEditorStore((s: any) => s.pushHistory);

  const activeObj = useMemo(() => {
    if (selectedObjectIds.length !== 1 || !activeSnapshot) return null;
    return activeSnapshot.objects.find((o: any) => o.id === selectedObjectIds[0]) ?? null;
  }, [selectedObjectIds, activeSnapshot]);

  const handleChange = (part: Partial<TacticalObject>) => {
    if (!activeObj || !activeSnapshot) return;
    updateObject(activeObj.id, part);
  };

  const handleBlur = () => {
    if (activeSnapshot) pushHistory(structuredClone(activeSnapshot));
  };

  // Collapsed Sidebar Rail
  if (isCollapsed) {
    return (
      <div className="w-11 h-full flex flex-col items-center py-3 bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl z-30 select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#5c635e] hover:text-[#1f2421] flex items-center justify-center transition-colors border border-[#e2e4df]"
          title="Expand Inspector Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="my-3 w-6 h-px bg-[#e2e4df]" />
        
        <div className="flex flex-col gap-2 items-center text-[#5c635e]">
          <SlidersHorizontal className="w-4 h-4" />
          {activeObj && (
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 h-full flex flex-col p-3 gap-3 overflow-y-auto scrollbar-hide bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl select-none text-[#1f2421]">
      {/* Top Header & Collapse Button */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#15803d]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2421]">
            {activeObj 
              ? ((activeObj as any).intent === 'pass' ? 'Pass Link Inspector' : `${activeObj.type.replace('_', ' ')} Inspector`) 
              : 'Tactical Settings'}
          </h3>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-lg text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] transition-colors"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!activeObj ? (
          <motion.div
            key="workspace-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {/* Quick Grid & Overlays Deck */}
            <div className="bg-[#f9faf8] p-3 rounded-xl border border-[#e2e4df] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5" /> Pitch Grid
                </span>
                <button
                  onClick={toggleGrid}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border",
                    gridEnabled 
                      ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]" 
                      : "bg-white text-[#5c635e] border-[#e2e4df]"
                  )}
                >
                  {gridEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5" /> Tactical Overlays
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['none', 'thirds', '18_zones', '5_vertical_lanes'] as const).map((opt) => {
                    const labels: Record<string, string> = {
                      none: 'None',
                      thirds: 'Thirds',
                      '18_zones': '18 Zones',
                      '5_vertical_lanes': '5 Lanes'
                    };
                    const isActive = pitchZoneOverlay === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setPitchZoneOverlay(isActive ? 'none' : opt)}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border text-center",
                          isActive
                            ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]"
                            : "bg-white text-[#5c635e] hover:text-[#1f2421] border-[#e2e4df]"
                        )}
                      >
                        {labels[opt]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Tactical Insights */}
            <div className="mt-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">AI Assistant</span>
              </div>
              <AIPanel />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeObj.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-3"
          >
            {/* Header / Lock Toggle */}
            <div className="flex items-center justify-between bg-[#f9faf8] p-2.5 rounded-xl border border-[#e2e4df]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#15803d]" />
                <span className="text-xs font-bold uppercase text-[#1f2421] truncate max-w-[150px]">
                  {activeObj.type}
                </span>
              </div>
              <button 
                onClick={() => { handleChange({ locked: !activeObj.locked } as any); handleBlur(); }}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  activeObj.locked ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-[#5c635e] border-[#e2e4df] hover:text-[#1f2421]"
                )}
                title={activeObj.locked ? "Unlock element" : "Lock element"}
              >
                {activeObj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Specific Object Controls */}
            <div className="bg-[#f9faf8] p-3 rounded-xl border border-[#e2e4df] space-y-3">
              {renderSpecificControls(activeObj, handleChange, handleBlur)}
            </div>

            {/* Visual Styles */}
            {hasVisualStyles(activeObj) && (
              <div className="bg-[#f9faf8] p-3 rounded-xl border border-[#e2e4df] space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Visual Style
                </span>
                {renderVisualStyleControls(activeObj, handleChange, handleBlur)}
              </div>
            )}

            {/* Layer & Object Info */}
            <div className="flex items-center justify-between text-[10px] font-medium text-[#5c635e] px-2.5 py-1.5 bg-[#f9faf8] rounded-lg border border-[#e2e4df]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#15803d]" />
                <span>Layer {activeObj.z_index}</span>
              </div>
              <span className="font-mono text-[9px] opacity-70">ID: {activeObj.id.split('-')[0]}</span>
            </div>

            {/* AI Assistant */}
            <div className="mt-1">
              <AIPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function renderSpecificControls(obj: any, onChange: any, onBlur: any) {
  switch (obj.type) {
    case 'player':
    case 'goalkeeper':
      return (
        <div className="space-y-3">
          <ControlGroup label="Squad Name / Label">
            <input
              className="w-full bg-white border border-[#e2e4df] rounded-lg px-3 py-1.5 text-xs text-[#1f2421] focus:outline-none focus:border-[#15803d] font-semibold"
              value={obj.label || ''}
              onChange={(e) => onChange({ label: e.target.value })}
              onBlur={onBlur}
              maxLength={20}
              placeholder="Player Name"
            />
          </ControlGroup>
          <ControlGroup label="Jersey Number">
            <input
              className="w-full bg-white border border-[#e2e4df] rounded-lg px-3 py-1.5 text-xs text-[#1f2421] font-mono font-bold focus:outline-none focus:border-[#15803d]"
              value={obj.number ?? ''}
              onChange={(e) => onChange({ number: e.target.value })}
              onBlur={onBlur}
              maxLength={3}
              placeholder="#"
            />
          </ControlGroup>
        </div>
      );
    case 'text':
    case 'callout':
      return (
        <ControlGroup label="Note / Annotation">
          <textarea
            className="w-full bg-white border border-[#e2e4df] rounded-lg px-3 py-2 text-xs text-[#1f2421] focus:outline-none focus:border-[#15803d] resize-none h-24 font-medium"
            value={obj.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onBlur}
            placeholder="Tactical note..."
          />
        </ControlGroup>
      );
    case 'zone':
    case 'shape':
      return (
        <div className="space-y-3">
          <ControlGroup label="Zone Title">
            <input
              className="w-full bg-white border border-[#e2e4df] rounded-lg px-3 py-1.5 text-xs text-[#1f2421] focus:outline-none focus:border-[#15803d] font-semibold"
              value={obj.label ?? ''}
              onChange={(e) => onChange({ label: e.target.value })}
              onBlur={onBlur}
              placeholder="Zone Title"
            />
          </ControlGroup>
          <ControlGroup label="Shape Style">
            <div className="flex bg-[#f4f5f1] p-1 rounded-lg border border-[#e2e4df]">
              {['rect', 'circle', 'triangle'].map((s) => (
                <button
                  key={s}
                  onClick={() => { onChange({ shape_type: s as any }); onBlur(); }}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all",
                    (obj.shape_type || 'rect') === s ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </ControlGroup>
        </div>
      );
    case 'arrow':
    case 'curved_arrow':
    case 'dashed_arrow':
    case 'dashed_curved': {
      const isPass = obj.intent === 'pass';
      const isCurved = obj.type === 'curved_arrow' || obj.type === 'dashed_curved';

      const handleStraightCurvedToggle = (targetIsCurved: boolean) => {
        if (targetIsCurved) {
          const midX = (obj.from_x + obj.to_x) / 2;
          const midY = (obj.from_y + obj.to_y) / 2;
          const angle = Math.atan2(obj.to_y - obj.from_y, obj.to_x - obj.from_x);
          const offset = 8; // Default 8% pitch curvature offset
          const bend_x = midX + Math.cos(angle + Math.PI / 2) * offset;
          const bend_y = midY + Math.sin(angle + Math.PI / 2) * offset;

          onChange({
            type: isPass ? 'dashed_curved' : 'curved_arrow',
            bend_x,
            bend_y
          });
        } else {
          onChange({
            type: isPass ? 'dashed_arrow' : 'arrow',
            bend_x: null,
            bend_y: null
          });
        }
        onBlur();
      };

      const handleCurveIntensityChange = (val: number) => {
        const midX = (obj.from_x + obj.to_x) / 2;
        const midY = (obj.from_y + obj.to_y) / 2;
        const angle = Math.atan2(obj.to_y - obj.from_y, obj.to_x - obj.from_x);
        const bend_x = midX + Math.cos(angle + Math.PI / 2) * val;
        const bend_y = midY + Math.sin(angle + Math.PI / 2) * val;
        onChange({ bend_x, bend_y });
      };

      // Current curve offset estimate
      const currentOffset = isCurved && obj.bend_x != null && obj.bend_y != null
        ? Math.round(Math.hypot(obj.bend_x - (obj.from_x + obj.to_x) / 2, obj.bend_y - (obj.from_y + obj.to_y) / 2))
        : 8;

      return (
        <div className="space-y-3">
          {/* Intent Badge */}
          <div className="flex items-center justify-between bg-[#f4f5f1] p-1.5 rounded-lg border border-[#e2e4df]">
            <span className="text-[10px] font-bold uppercase text-[#5c635e]">Tactical Type:</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              isPass ? "bg-[#eef7f2] text-[#15803d] border border-[#bbf7d0]" : "bg-white text-[#2563eb] border border-[#bfdbfe]"
            )}>
              {isPass ? "Ball Pass Link" : "Player Run"}
            </span>
          </div>

          <ControlGroup label="Geometry Mode">
            <div className="flex bg-[#f4f5f1] p-1 rounded-lg border border-[#e2e4df]">
              <button
                onClick={() => handleStraightCurvedToggle(false)}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all text-center",
                  !isCurved ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                )}
              >
                Straight
              </button>
              <button
                onClick={() => handleStraightCurvedToggle(true)}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all text-center",
                  isCurved ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                )}
              >
                Curved
              </button>
            </div>
          </ControlGroup>

          <ControlGroup label="Arrowhead">
            <div className="flex bg-[#f4f5f1] p-1 rounded-lg border border-[#e2e4df]">
              {[
                { id: 'none', label: 'None' },
                { id: 'filled', label: 'End' },
                { id: 'both', label: 'Both' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onChange({ arrowhead: item.id as any }); onBlur(); }}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all",
                    (obj.arrowhead || 'filled') === item.id ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </ControlGroup>

          <button
            onClick={() => {
              onChange({
                from_x: obj.to_x,
                from_y: obj.to_y,
                to_x: obj.from_x,
                to_y: obj.from_y,
                from_id: obj.to_id,
                to_id: obj.from_id
              });
              onBlur();
            }}
            className="w-full py-1.5 rounded-lg bg-white hover:bg-[#f4f5f1] text-[#1f2421] text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-[#e2e4df] shadow-sm"
          >
            <RotateCcw className="w-3 h-3 text-[#15803d]" /> Reverse Direction (R)
          </button>
        </div>
      );
    }
    case 'cone':
    case 'ladder':
    case 'mini_goal':
    case 'mannequin':
      return (
        <ControlGroup label="Equipment Type">
          <div className="grid grid-cols-2 gap-1 bg-[#f4f5f1] p-1 rounded-lg border border-[#e2e4df]">
            {['cone', 'ladder', 'mini_goal', 'mannequin'].map((s) => (
              <button
                key={s}
                onClick={() => { onChange({ type: s as any }); onBlur(); }}
                className={cn(
                  "py-1 text-[9px] font-bold uppercase rounded transition-all text-center truncate",
                  obj.type === s ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </ControlGroup>
      );
    default:
      return null;
  }
}

function renderVisualStyleControls(obj: any, onChange: any, onBlur: any) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(obj.fill_color !== undefined || obj.color !== undefined) && (
          <ControlGroup label="Color">
            <ColorPicker
              value={obj.fill_color || obj.color}
              onChange={(color) => onChange(obj.fill_color !== undefined ? { fill_color: color } : { color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
        {obj.outline_color !== undefined && (
          <ControlGroup label="Stroke">
            <ColorPicker
              value={obj.outline_color}
              onChange={(color) => onChange({ outline_color: color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
        {obj.stroke_color !== undefined && (
          <ControlGroup label="Stroke">
            <ColorPicker
              value={obj.stroke_color}
              onChange={(color) => onChange({ stroke_color: color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
      </div>

      {obj.style !== undefined && (
        <ControlGroup label="Shape Geometry">
          <div className="flex bg-[#f4f5f1] p-1 rounded-lg border border-[#e2e4df]">
            {['circle', 'square', 'diamond'].map((s) => (
              <button
                key={s}
                onClick={() => { onChange({ style: s as any }); onBlur(); }}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all",
                  obj.style === s ? "bg-white text-[#15803d] shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </ControlGroup>
      )}

      {obj.width !== undefined && (
        <ControlGroup label="Stroke Width">
          <input
            type="range"
            min="1"
            max="12"
            value={obj.width}
            onChange={(e) => onChange({ width: parseInt(e.target.value) })}
            onMouseUp={onBlur}
            className="w-full accent-[#15803d] h-1.5 bg-[#e2e4df] rounded-lg appearance-none cursor-pointer"
          />
        </ControlGroup>
      )}

      {obj.fill_opacity !== undefined && (
        <ControlGroup label="Opacity">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={obj.fill_opacity}
            onChange={(e) => onChange({ fill_opacity: parseFloat(e.target.value) })}
            onMouseUp={onBlur}
            className="w-full accent-[#15803d] h-1.5 bg-[#e2e4df] rounded-lg appearance-none cursor-pointer"
          />
        </ControlGroup>
      )}
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-bold text-[#5c635e] uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function hasVisualStyles(obj: TacticalObject): boolean {
  if (obj.type === 'ball') return false;
  if (['cone', 'ladder', 'mini_goal', 'mannequin'].includes(obj.type)) return true;
  return (
    'fill_color' in obj ||
    'color' in obj ||
    'outline_color' in obj ||
    'stroke_color' in obj ||
    'style' in obj ||
    'width' in obj ||
    'fill_opacity' in obj
  );
}
