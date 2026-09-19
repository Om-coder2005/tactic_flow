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
      <button
        className={cn(
          "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm",
          isOpen 
            ? "bg-[#EBF5EB] text-[#55AA55] border-[#55AA55]/40" 
            : "bg-[#E8ECE9] hover:bg-[#D0D8D2] text-[#161A17] border-[#D0D8D2]"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>Settings</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[320px] z-[220] pointer-events-none"
          >
            <Card className="pointer-events-auto bg-white border border-[#e2e4df] shadow-xl overflow-hidden rounded-2xl text-[#1f2421]">
               <CardHeader className="bg-[#f9faf8] p-3 flex-row items-center justify-between space-y-0 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#15803d]" />
                    <CardTitle className="text-[#1f2421] text-xs uppercase tracking-wider font-bold">Workspace Settings</CardTitle>
                  </div>
               </CardHeader>

               <CardContent className="p-3 space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide bg-white">
                  {/* Pitch Theme Selection */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#5c635e]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">Pitch Themes</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1">
                      {THEME_OPTIONS.map((theme) => {
                        const isSelected = pitchTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left bg-[#f9faf8] hover:bg-[#f4f5f1]",
                              isSelected 
                                ? "border-[#15803d] bg-[#eef7f2]" 
                                : "border-[#e2e4df]"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Colored dot preview */}
                              <div className={cn("w-6 h-6 rounded-lg relative flex items-center justify-center overflow-hidden border border-[#e2e4df]", theme.previewBg)}>
                                <span className="text-xs relative z-10">{theme.flag}</span>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1f2421] uppercase tracking-tight">{theme.name}</div>
                                <div className="text-[9px] text-[#5c635e] font-semibold">{theme.desc}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#15803d] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="opacity-40 bg-[#e2e4df]" />

                  {/* Grid Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#5c635e]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">Layout Helpers</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={toggleGrid}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all bg-[#f9faf8] hover:bg-[#f4f5f1]",
                          gridEnabled 
                            ? "border-[#15803d] bg-[#eef7f2]"
                            : "border-[#e2e4df]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Grid className="w-4 h-4 text-[#5c635e]" />
                          <div>
                            <div className="text-xs font-bold text-[#1f2421]">Show Tactical Grid</div>
                            <div className="text-[9px] text-[#5c635e]">Align players with precision lines</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out",
                          gridEnabled ? "bg-[#15803d]" : "bg-[#e2e4df]"
                        )}>
                          <div className={cn(
                            "w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out transform",
                            gridEnabled ? "translate-x-3" : "translate-x-0"
                          )} />
                        </div>
                      </button>

                      {/* Zones Selection */}
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e] mb-1">Tactical Zones</div>
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
                                "flex items-center justify-between p-2 rounded-lg border transition-all text-left bg-[#f9faf8] hover:bg-[#f4f5f1]",
                                isSelected 
                                  ? "border-[#15803d] bg-[#eef7f2]"
                                  : "border-[#e2e4df]"
                              )}
                            >
                              <div className="text-[11px] font-bold text-[#1f2421] uppercase tracking-tight">{labels[zone]}</div>
                              {isSelected && <Check className="w-3 h-3 text-[#15803d] flex-shrink-0" />}
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
