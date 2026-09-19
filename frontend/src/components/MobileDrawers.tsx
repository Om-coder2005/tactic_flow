import React, { useState, useEffect } from 'react';
import { useEditorStore, type ToolType } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { PREBUILT_FORMATIONS, type FormationTemplateDef } from '@/features/formations/prebuiltFormations';
import { createPlayer, createGoalkeeper } from '@/features/objects/objectFactories';
import { tacticService } from '@/services/tacticService';
import { useAuthStore } from '@/stores/authStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { AIPanel } from '@/features/ai/AIPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  Layers, 
  Sparkles, 
  X, 
  Users, 
  Settings as SettingsIcon, 
  MoreHorizontal,
  Check,
  Palette,
  Grid,
  ShieldCheck,
  CircleDot,
  Square,
  Triangle,
  ScanLine,
  Goal,
  PersonStanding,
  Eraser
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PitchTheme } from '@/types';

// Theme options definition for mobile settings
const THEME_OPTIONS = [
  { id: 'classic_green', name: 'Classic Green', flag: '🟢', bg: 'bg-[#2d8a4e]' },
  { id: 'tactical_dark', name: 'Tactical Dark', flag: '⚫', bg: 'bg-[#1a1a2e]' },
  { id: 'minimal', name: 'Minimalist', flag: '⚪', bg: 'bg-[#fafafa]' },
  { id: 'wc_qatar', name: 'Qatar 2022', flag: '🇶🇦', bg: 'bg-[#5c0632]' },
  { id: 'wc_brasil', name: 'Brasil 2014', flag: '🇧🇷', bg: 'bg-[#007a33]' },
  { id: 'wc_classic', name: 'Mexico 1970', flag: '🇲🇽', bg: 'bg-[#436d4e]' },
  { id: 'wc_russia', name: 'Russia 2018', flag: '🇷🇺', bg: 'bg-[#8a111a]' }
];

const MORE_TOOLS = [
  { id: 'goalkeeper', label: 'Goalkeeper', icon: ShieldCheck },
  { id: 'ball', label: 'Football', icon: CircleDot },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'cone', label: 'Cone', icon: Triangle },
  { id: 'ladder', label: 'Ladder', icon: ScanLine },
  { id: 'mini_goal', label: 'Mini Goal', icon: Goal },
  { id: 'mannequin', label: 'Mannequin', icon: PersonStanding },
  { id: 'eraser', label: 'Eraser', icon: Eraser }
];

export const MobileDrawers: React.FC = () => {
  const isMobileOverlaysOpen = useEditorStore((s: any) => s.isMobileOverlaysOpen);
  const setMobileOverlaysOpen = useEditorStore((s: any) => s.setMobileOverlaysOpen);
  
  const isMobileFormationsOpen = useEditorStore((s: any) => s.isMobileFormationsOpen);
  const setMobileFormationsOpen = useEditorStore((s: any) => s.setMobileFormationsOpen);

  const isMobileSettingsOpen = useEditorStore((s: any) => s.isMobileSettingsOpen);
  const setMobileSettingsOpen = useEditorStore((s: any) => s.setMobileSettingsOpen);

  const isMobileToolsOpen = useEditorStore((s: any) => s.isMobileToolsOpen);
  const setMobileToolsOpen = useEditorStore((s: any) => s.setMobileToolsOpen);

  const activeTool = useEditorStore((s: any) => s.activeTool);
  const setTool = useEditorStore((s: any) => s.setTool);

  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);

  const pitchTheme = useEditorStore((s: any) => s.pitchTheme);
  const setPitchTheme = useEditorStore((s: any) => s.setPitchTheme);

  const currentProject = useProjectStore((s: any) => s.currentProject);

  const [customFormations, setCustomFormations] = useState<any[]>([]);
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);
  const pushHistory = useEditorStore((s: any) => s.pushHistory);

  useEffect(() => {
    if (isMobileFormationsOpen && isAuthenticated) {
      tacticService.getFormations().then((res) => {
        if (Array.isArray(res)) {
          setCustomFormations(res.filter((f) => !f.is_builtin));
        }
      }).catch(console.error);
    }
  }, [isMobileFormationsOpen, isAuthenticated]);

  const applyFormation = (template: FormationTemplateDef, team: 'home' | 'away') => {
    const projectStore = useProjectStore.getState();
    const activeSnapshot = projectStore.getActiveSnapshot();
    if (!activeSnapshot) return;

    pushHistory(structuredClone(activeSnapshot));

    const isAway = team === 'away';
    const existingPlayers = activeSnapshot.objects.filter(o => 
      (o as any).team === team && (o.type === 'player' || o.type === 'goalkeeper')
    );

    if (existingPlayers.length > 0) {
      const updates: { id: string; updates: any }[] = [];
      const nodes = [...template.nodes];
      
      const gkNode = nodes.find(n => n.role === 'GK');
      const otherNodes = nodes.filter(n => n.role !== 'GK');
      const gkPlayer = existingPlayers.find(p => p.type === 'goalkeeper');
      const otherPlayers = existingPlayers.filter(p => p.type !== 'goalkeeper');

      if (gkPlayer && gkNode) {
        updates.push({
          id: gkPlayer.id,
          updates: { x: isAway ? 100 - gkNode.x : gkNode.x, y: gkNode.y }
        });
      }

      otherPlayers.sort((a, b) => a.y - b.y || a.x - b.x);
      otherNodes.sort((a, b) => a.y - b.y || a.x - b.x);

      otherPlayers.forEach((p, i) => {
        const node = otherNodes[i];
        if (node) {
          updates.push({
            id: p.id,
            updates: { x: isAway ? 100 - node.x : node.x, y: node.y, label: node.role }
          });
        }
      });

      usePlaybackStore.getState().animateObjectUpdates(updates);

      if (existingPlayers.length < template.nodes.length) {
         const remainingNodes = template.nodes.slice(existingPlayers.length);
         remainingNodes.forEach(node => {
            const finalX = isAway ? 100 - node.x : node.x;
            const obj = node.role === 'GK' ? createGoalkeeper(finalX, node.y, team) : createPlayer(finalX, node.y, team);
            if (node.role !== 'GK') obj.label = node.role;
            projectStore.addObject(obj);
         });
      }
    } else {
      template.nodes.forEach((node) => {
        const finalX = isAway ? 100 - node.x : node.x;
        const obj = node.role === 'GK' ? createGoalkeeper(finalX, node.y, team) : createPlayer(finalX, node.y, team);
        if (node.role !== 'GK') obj.label = node.role;
        projectStore.addObject(obj);
      });
    }

    setMobileFormationsOpen(false);
  };

  const activeDrawer = isMobileOverlaysOpen 
    ? 'overlays' 
    : isMobileFormationsOpen 
      ? 'formations' 
      : isMobileSettingsOpen 
        ? 'settings' 
        : isMobileToolsOpen 
          ? 'tools' 
          : null;

  const closeAll = () => {
    setMobileOverlaysOpen(false);
    setMobileFormationsOpen(false);
    setMobileSettingsOpen(false);
    setMobileToolsOpen(false);
  };

  return (
    <AnimatePresence>
      {activeDrawer && (
        <motion.div
          key="mobile-inline-drawer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="md:hidden w-full overflow-hidden flex-shrink-0 relative z-[40]"
        >
          {/* Drawer Inner Box emerging out of bottom deck */}
          <div className="w-full max-h-[45vh] bg-white border border-[#e2e4df] rounded-2xl shadow-lg p-3 overflow-y-auto scrollbar-hide text-[#1f2421] space-y-3 my-1">
            {/* 1. OVERLAYS DRAWER */}
            {activeDrawer === 'overlays' && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-[#15803d]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                      Tactical Overlays & AI
                    </h3>
                  </div>
                  <button onClick={closeAll} className="p-1 text-[#5c635e]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#f9faf8] p-2 rounded-xl border border-[#e2e4df] flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider">
                    Pitch Grid
                  </span>
                  <button
                    onClick={toggleGrid}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase border",
                      gridEnabled ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]" : "bg-white text-[#5c635e] border-[#e2e4df]"
                    )}
                  >
                    {gridEnabled ? 'Grid ON' : 'Grid OFF'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#15803d]" /> Tactical Overlays
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['none', 'thirds', '18_zones', '5_vertical_lanes'] as const).map((opt) => {
                      const labels: Record<string, string> = { none: 'None', thirds: 'Thirds', '18_zones': '18 Zones', '5_vertical_lanes': '5 Lanes' };
                      const isActive = pitchZoneOverlay === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setPitchZoneOverlay(isActive ? 'none' : opt)}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[10px] font-semibold uppercase transition-all border text-center min-h-[36px]",
                            isActive ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0] font-bold" : "bg-white text-[#5c635e] border-[#e2e4df]"
                          )}
                        >
                          {labels[opt]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e2e4df]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">AI Assistant</span>
                  </div>
                  <AIPanel />
                </div>
              </>
            )}

            {/* 2. FORMATIONS DRAWER */}
            {activeDrawer === 'formations' && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#15803d]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                      Tactical Formations Library
                    </h3>
                  </div>
                  <button onClick={closeAll} className="p-1 text-[#5c635e]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {PREBUILT_FORMATIONS.map((fmt) => (
                    <div key={fmt.id} className="bg-[#f9faf8] p-2 rounded-xl border border-[#e2e4df] flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase text-[#1f2421]">{fmt.name}</h4>
                        <span className="text-[9px] text-[#5c635e] uppercase">{fmt.format} • {fmt.nodes.length} Players</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => applyFormation(fmt, 'home')}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-[9px] font-bold uppercase"
                        >
                          Home
                        </button>
                        <button
                          onClick={() => applyFormation(fmt, 'away')}
                          className="px-2.5 py-1 rounded bg-red-600 text-white text-[9px] font-bold uppercase"
                        >
                          Away
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 3. SETTINGS DRAWER */}
            {activeDrawer === 'settings' && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-[#15803d]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                      Pitch & Theme Settings
                    </h3>
                  </div>
                  <button onClick={closeAll} className="p-1 text-[#5c635e]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#5c635e]">Pitch Theme</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = pitchTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setPitchTheme(theme.id as any);
                            if (currentProject) {
                              useProjectStore.setState({ isDirty: true, saveStatus: 'unsaved' });
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border text-left bg-[#f9faf8]",
                            isSelected ? "border-[#15803d] bg-[#eef7f2]" : "border-[#e2e4df]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{theme.flag}</span>
                            <span className="text-xs font-bold uppercase text-[#1f2421]">{theme.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#15803d]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 4. MORE TOOLS DRAWER (...) */}
            {activeDrawer === 'tools' && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <MoreHorizontal className="w-4 h-4 text-[#15803d]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                      More Tactical Tools
                    </h3>
                  </div>
                  <button onClick={closeAll} className="p-1 text-[#5c635e]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MORE_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setTool(tool.id as any);
                          closeAll();
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all touch-manipulation",
                          isActive ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0] font-bold" : "bg-[#f9faf8] text-[#5c635e] border-[#e2e4df]"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
