import React, { useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import type { TacticalObject, NodeStyle, ArrowheadStyle } from '@/types';
import { AIPanel } from '@/features/ai/AIPanel';
import { ColorPicker } from '@/components/ColorPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Settings2, 
  Lock, 
  Unlock, 
  Layers, 
  Sparkles,
  Type,
  Palette,
  Maximize2,
  Users,
  Layout,
  Grid3X3,
  Download,
  Play,
  Brush,
  Magnet
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const RightPanel: React.FC = () => {
  const userMode = useEditorStore((s: any) => s.userMode);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const togglePresentationMode = useEditorStore((s: any) => s.togglePresentationMode);

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

  return (
    <div className="w-panel h-full flex flex-col p-4 gap-4 overflow-y-auto scrollbar-hide bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 rounded-2xl shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)]">
      <AnimatePresence mode="wait">
        {!activeObj ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-4"
          >
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center mx-auto mb-3">
                  <Maximize2 className="w-5 h-5 text-surface-400" />
                </div>
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">
                  No Selection
                </p>
                <p className="text-[10px] text-surface-400 mt-1">
                  Select an element on the board to modify its properties
                </p>
              </CardContent>
            </Card>

            {/* Role-first Quick Deck (no behavior changes, just shortcuts) */}
            <Card className="bg-white dark:bg-surface-800 border-2 border-black dark:border-surface-500 shadow-[3px_3px_0_#121212] dark:shadow-[3px_3px_0_rgba(255,255,255,0.15)] rounded-2xl">
              <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#35d7ff] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#121212]">
                    {userMode === 'coach' ? <Users className="w-4 h-4 text-black" /> : userMode === 'creator' ? <Brush className="w-4 h-4 text-black" /> : <Layout className="w-4 h-4 text-black" />}
                  </div>
                  <div>
                    <CardTitle className="text-black dark:text-white text-[11px] uppercase tracking-widest font-black">Quick Deck</CardTitle>
                    <p className="text-[9px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-wider">{userMode}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-black dark:text-white">
                    <Grid3X3 className="w-3.5 h-3.5" />
                    Grid
                  </div>
                  <button
                    onClick={toggleGrid}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                      gridEnabled ? "bg-[#ffd400] text-black" : "bg-white dark:bg-surface-800 text-black dark:text-white hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black"
                    )}
                  >
                    {gridEnabled ? 'On' : 'Off'}
                  </button>
                </div>


                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-black dark:text-white">
                    <Layout className="w-3.5 h-3.5" />
                    Zones
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['none', 'thirds', '18_zones', '5_vertical_lanes'] as const).map((opt) => {
                      const labels: Record<string, string> = {
                        none: 'None',
                        thirds: 'Thirds',
                        '18_zones': '18 Zones',
                        '5_vertical_lanes': '5 Lanes'
                      };
                      return (
                        <button
                          key={opt}
                          onClick={() => setPitchZoneOverlay(pitchZoneOverlay === opt ? 'none' : opt)}
                          className={cn(
                            "flex-1 py-2 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] text-[9px] font-black uppercase tracking-wider transition-all",
                            pitchZoneOverlay === opt ? "bg-[#35d7ff] text-black" : "bg-white dark:bg-surface-800 text-black dark:text-white hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black"
                          )}
                        >
                          {labels[opt]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="opacity-70 bg-black" />

                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePresentationMode}
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 text-black dark:text-white"
                  >
                    <Play className="w-4 h-4" /> Present
                  </button>
                  <div className="flex-1 px-3 py-2 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] bg-[#ffd400] text-[10px] font-black text-black uppercase tracking-wider flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                    <Download className="w-4 h-4" /> Export
                  </div>
                </div>
                <p className="text-[9px] text-surface-500">
                  Export stays in the top bar to avoid duplicate actions.
                </p>
              </CardContent>
            </Card>
            
            <AIPanel />
          </motion.div>
        ) : (
          <motion.div
            key={activeObj.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-4"
          >
            {/* Header Card */}
            <Card className="bg-[#ffd400] dark:bg-surface-800 border-[3px] border-black dark:border-surface-500 shadow-[4px_4px_0_#121212] dark:shadow-[4px_4px_0_rgba(255,255,255,0.15)]">
               <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-retro-mustard flex items-center justify-center text-retro-ink">
                       <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-black dark:text-white text-xs uppercase tracking-widest">Inspector</CardTitle>
                      <p className="text-[9px] font-black text-black dark:text-surface-400 uppercase tracking-tighter opacity-80">{activeObj.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleChange({ locked: !activeObj.locked } as any); handleBlur(); }}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      activeObj.locked ? "bg-retro-burgundy text-white" : "bg-surface-700 text-surface-300 hover:bg-surface-600"
                    )}
                  >
                    {activeObj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
               </CardHeader>
            </Card>

            {/* Properties Card */}
            <Card>
               <CardContent className="p-4 space-y-4">
                  {renderSpecificControls(activeObj, handleChange, handleBlur)}
               </CardContent>
            </Card>

            {/* Visuals Card */}
            {hasVisualStyles(activeObj) && (
              <Card>
                 <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-[10px] uppercase tracking-widest text-surface-400 flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Visual Style
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-4">
                    {renderVisualStyleControls(activeObj, handleChange, handleBlur)}
                 </CardContent>
              </Card>
            )}

            {/* System Info */}
            <Card className="bg-surface-50/30 dark:bg-surface-900/30 border border-surface-200/50 dark:border-surface-600/50 rounded-2xl shadow-none">
               <CardContent className="p-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400">
                  <div className="flex items-center gap-1.5 pl-1 select-none">
                    <Layers className="w-3.5 h-3.5 text-retro-mustard" />
                    <span>Layer <span className="font-mono text-retro-ink dark:text-white bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded ml-1">{activeObj.z_index}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 pr-1 select-none">
                    <span>ID</span>
                    <span className="font-mono text-retro-ink dark:text-white bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded">{activeObj.id.split('-')[0]}</span>
                  </div>
               </CardContent>
            </Card>

            <Separator className="opacity-50" />

            {/* AI Assistant */}
            <div className="mt-2">
               <div className="flex items-center gap-2 px-2 mb-3">
                  <Sparkles className="w-3 h-3 text-retro-mustard" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-surface-500">Tactical Intelligence</span>
               </div>
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
        <div className="space-y-4">
          <ControlGroup label="Squad Label">
            <input
              className="w-full bg-surface-100 dark:bg-surface-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-retro-mustard transition-all"
              value={obj.label}
              onChange={(e) => onChange({ label: e.target.value })}
              onBlur={onBlur}
              maxLength={20}
            />
          </ControlGroup>
          <ControlGroup label="Number">
            <input
              className="w-full bg-surface-100 dark:bg-surface-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold font-mono focus:ring-2 ring-retro-mustard transition-all"
              value={obj.number ?? ''}
              onChange={(e) => onChange({ number: e.target.value })}
              onBlur={onBlur}
              maxLength={3}
            />
          </ControlGroup>
        </div>
      );
    case 'text':
    case 'callout':
      return (
        <ControlGroup label="Analysis Note">
          <textarea
            className="w-full bg-surface-100 dark:bg-surface-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-retro-mustard transition-all resize-none h-32"
            value={obj.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onBlur}
          />
        </ControlGroup>
      );
    case 'zone':
    case 'shape':
      return (
        <div className="space-y-4">
          <ControlGroup label="Zone Label">
             <input
              className="w-full bg-surface-100 dark:bg-surface-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-retro-mustard transition-all"
              value={obj.label ?? ''}
              onChange={(e) => onChange({ label: e.target.value })}
              onBlur={onBlur}
            />
          </ControlGroup>
          <ControlGroup label="Shape">
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
               {['rect', 'circle', 'triangle'].map((s) => (
                 <button
                   key={s}
                   onClick={() => { onChange({ shape_type: s as any }); onBlur(); }}
                   className={cn(
                     "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                     (obj.shape_type || 'rect') === s ? "bg-white dark:bg-surface-700 shadow-sm text-retro-ink dark:text-white" : "text-surface-400"
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
    case 'dashed_curved':
      return (
        <div className="space-y-4">
          <ControlGroup label="Arrow Style">
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl flex-wrap gap-1">
               {['arrow', 'curved_arrow', 'dashed_arrow', 'dashed_curved'].map((s) => (
                 <button
                   key={s}
                   onClick={() => { onChange({ type: s as any }); onBlur(); }}
                   className={cn(
                     "flex-1 min-w-[45%] py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                     obj.type === s ? "bg-white dark:bg-surface-700 shadow-sm text-retro-ink dark:text-white" : "text-surface-400"
                   )}
                 >
                   {s.replace('_', ' ')}
                 </button>
               ))}
            </div>
          </ControlGroup>
          
          <ControlGroup label="Arrowhead">
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
               {['filled', 't-bar', 'none'].map((s) => (
                 <button
                   key={s}
                   onClick={() => { onChange({ arrowhead: s as any }); onBlur(); }}
                   className={cn(
                     "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                     obj.arrowhead === s ? "bg-white dark:bg-surface-700 shadow-sm text-retro-ink dark:text-white" : "text-surface-400"
                   )}
                 >
                   {s}
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
            className="w-full py-2.5 rounded-xl border-2 border-black dark:border-surface-500 bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black text-xs font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] text-black dark:text-white flex items-center justify-center gap-2"
          >
            Reverse Direction
          </button>
        </div>
      );
    case 'cone':
    case 'ladder':
    case 'mini_goal':
    case 'mannequin':
      return (
        <ControlGroup label="Equipment Type">
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl flex-wrap gap-1">
             {['cone', 'ladder', 'mini_goal', 'mannequin'].map((s) => (
               <button
                 key={s}
                 onClick={() => { onChange({ type: s as any }); onBlur(); }}
                 className={cn(
                   "flex-1 min-w-[45%] py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                   obj.type === s ? "bg-white dark:bg-surface-700 shadow-sm text-retro-ink dark:text-white" : "text-surface-400"
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(obj.fill_color !== undefined || obj.color !== undefined) && (
          <ControlGroup label="Primary Color">
            <ColorPicker
              value={obj.fill_color || obj.color}
              onChange={(color) => onChange(obj.fill_color !== undefined ? { fill_color: color } : { color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
        {obj.outline_color !== undefined && (
          <ControlGroup label="Stroke Color">
            <ColorPicker
              value={obj.outline_color}
              onChange={(color) => onChange({ outline_color: color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
        {obj.stroke_color !== undefined && (
          <ControlGroup label="Stroke Color">
            <ColorPicker
              value={obj.stroke_color}
              onChange={(color) => onChange({ stroke_color: color })}
              onBlur={onBlur}
            />
          </ControlGroup>
        )}
      </div>

      {obj.style !== undefined && (
        <ControlGroup label="Geometry Style">
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
             {['circle', 'square', 'diamond'].map((s) => (
               <button
                 key={s}
                 onClick={() => { onChange({ style: s as any }); onBlur(); }}
                 className={cn(
                   "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all",
                   obj.style === s ? "bg-white dark:bg-surface-700 shadow-sm text-retro-ink dark:text-white" : "text-surface-400"
                 )}
               >
                 {s}
               </button>
             ))}
          </div>
        </ControlGroup>
      )}

      {obj.width !== undefined && (
        <ControlGroup label="Weight">
          <input
            type="range"
            min="1"
            max="12"
            value={obj.width}
            onChange={(e) => onChange({ width: parseInt(e.target.value) })}
            onMouseUp={onBlur}
            className="w-full accent-retro-mustard h-1.5 bg-surface-200 dark:bg-surface-800 rounded-lg appearance-none cursor-pointer"
          />
        </ControlGroup>
      )}

      {obj.fill_opacity !== undefined && (
        <ControlGroup label="Transparency">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={obj.fill_opacity}
            onChange={(e) => onChange({ fill_opacity: parseFloat(e.target.value) })}
            onMouseUp={onBlur}
            className="w-full accent-retro-mustard h-1.5 bg-surface-200 dark:bg-surface-800 rounded-lg appearance-none cursor-pointer"
          />
        </ControlGroup>
      )}
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest pl-1">
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
