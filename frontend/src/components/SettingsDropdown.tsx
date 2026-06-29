import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  ChevronDown, 
  Grid, 
  Palette,
  Check,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PitchTheme } from '@/types';

interface ThemeOption {
  id: PitchTheme;
  name: string;
  desc: string;
  flag: string;
  previewBg: string;
  previewLine: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'classic_green',
    name: 'Classic Green',
    desc: 'Standard grass football field',
    flag: '🟢',
    previewBg: 'bg-[#2d8a4e]',
    previewLine: 'border-white'
  },
  {
    id: 'tactical_dark',
    name: 'Tactical Dark',
    desc: 'Dark high-contrast analysis board',
    flag: '⚫',
    previewBg: 'bg-[#1a1a2e]',
    previewLine: 'border-[#4a5568]'
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    desc: 'Clean paper aesthetic',
    flag: '⚪',
    previewBg: 'bg-[#fafafa]',
    previewLine: 'border-[#d1d5db]'
  },
  {
    id: 'wc_qatar',
    name: 'Qatar 2022',
    desc: 'Deep burgundy and desert gold',
    flag: '🇶🇦',
    previewBg: 'bg-[#5c0632]',
    previewLine: 'border-[#f3c46b]'
  },
  {
    id: 'wc_brasil',
    name: 'Brasil 2014',
    desc: 'Vibrant green and samba yellow',
    flag: '🇧🇷',
    previewBg: 'bg-[#007a33]',
    previewLine: 'border-[#fed100]'
  },
  {
    id: 'wc_classic',
    name: 'Mexico 1970',
    desc: 'Vintage warm olive and cream',
    flag: '🇲🇽',
    previewBg: 'bg-[#436d4e]',
    previewLine: 'border-[#f5f2eb]'
  },
  {
    id: 'wc_russia',
    name: 'Russia 2018',
    desc: 'Imperial ruby red and gold',
    flag: '🇷🇺',
    previewBg: 'bg-[#8a111a]',
    previewLine: 'border-[#ffd700]'
  }
];

export const SettingsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pitchTheme = useEditorStore((s: any) => s.pitchTheme);
  const setPitchTheme = useEditorStore((s: any) => s.setPitchTheme);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);

  // Sync to database if project is active
  const currentProject = useProjectStore((s: any) => s.currentProject);
  const updateProjectInStore = useProjectStore((s: any) => s.updateProject);

  const handleThemeChange = (themeId: PitchTheme) => {
    setPitchTheme(themeId);
    // If we have a project loaded, mark it as dirty or save theme updates
    if (currentProject) {
      // We will trigger a state change in the projectStore
      useProjectStore.setState({ isDirty: true, saveStatus: 'unsaved' });
      // Update local project values
      useProjectStore.setState((s: any) => {
        if (s.currentProject) {
          s.currentProject.theme = themeId;
        }
        return s;
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className={cn(
          "h-10 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#121212]",
          isOpen ? "bg-[#35d7ff] text-black" : "bg-white dark:bg-surface-800 text-surface-700 dark:text-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
        <ChevronDown className={cn("w-3 h-3 ml-2 transition-transform", isOpen && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-3 right-0 w-[320px] z-[220] pointer-events-none"
          >
            <Card className="pointer-events-auto bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)] overflow-hidden rounded-2xl">
               <CardHeader className="bg-[#ffd400] p-4 flex-row items-center justify-between space-y-0 border-b-[3px] border-black">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-black" />
                    <CardTitle className="text-black text-xs uppercase tracking-widest font-black">Workspace Settings</CardTitle>
                  </div>
               </CardHeader>

               <CardContent className="p-4 space-y-4 max-h-[480px] overflow-y-auto scrollbar-hide bg-[#fffdf7] dark:bg-surface-900">
                  {/* Pitch Theme Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-surface-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Pitch Themes</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1.5">
                      {THEME_OPTIONS.map((theme) => {
                        const isSelected = pitchTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] transition-all text-left bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black",
                              isSelected 
                                ? "ring-2 ring-black/10 dark:ring-white/10" 
                                : ""
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {/* Colored dot preview */}
                              <div className={cn("w-7 h-7 rounded-lg relative flex items-center justify-center overflow-hidden shadow-inner border border-surface-200 dark:border-surface-500", theme.previewBg)}>
                                <div className={cn("w-4 h-4 border-l border-t absolute top-1.5 left-1.5 rotate-45 opacity-50", theme.previewLine)} />
                                <span className="text-xs relative z-10">{theme.flag}</span>
                              </div>
                              <div>
                                <div className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-tight">{theme.name}</div>
                                <div className="text-[9px] text-surface-400 font-bold">{theme.desc}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-retro-mustard flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="opacity-70 bg-black dark:bg-surface-700" />

                  {/* Grid Controls */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5 text-surface-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Layout Helpers</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={toggleGrid}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border-2 border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)] text-left transition-all bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black",
                          gridEnabled 
                            ? "ring-2 ring-black/10 dark:ring-white/10"
                            : ""
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Grid className="w-4 h-4 text-surface-400" />
                          <div>
                            <div className="text-xs font-bold text-surface-900 dark:text-white">Show Tactical Grid</div>
                            <div className="text-[9px] text-surface-400">Align players with precision lines</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                          gridEnabled ? "bg-retro-mustard" : "bg-surface-300 dark:bg-surface-700"
                        )}>
                          <div className={cn(
                            "w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out transform",
                            gridEnabled ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                      </button>

                      {/* Zones Selection */}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">Tactical Zones</div>
                        {(['none', 'thirds', '18_zones', '5_vertical_lanes'] as const).map((zone) => {
                          const isSelected = pitchZoneOverlay === zone;
                          const labels: Record<string, string> = {
                            none: 'No Zones',
                            thirds: 'Pitch Thirds',
                            '18_zones': '18 Zones',
                            '5_vertical_lanes': '5 Vertical Lanes'
                          };
                          return (
                            <button
                              key={zone}
                              onClick={() => setPitchZoneOverlay(zone)}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg border-2 transition-all text-left bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black",
                                isSelected 
                                  ? "border-black dark:border-surface-500 shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)]"
                                  : "border-transparent"
                              )}
                            >
                              <div className="text-[11px] font-bold text-surface-900 dark:text-white uppercase tracking-tight">{labels[zone]}</div>
                              {isSelected && <Check className="w-3 h-3 text-retro-mustard flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
