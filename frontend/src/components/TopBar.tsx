import React, { useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { FormationDropdown } from '@/components/FormationDropdown';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { ExportModal } from '@/features/export/ExportModal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Undo2, 
  Redo2, 
  Grid, 
  Layout, 
  Moon, 
  Sun, 
  Maximize, 
  Play, 
  Download, 
  CloudCheck, 
  CloudAlert, 
  RefreshCcw,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TopBar: React.FC = () => {
  const undo = useEditorStore((s: any) => s.undo);
  const redo = useEditorStore((s: any) => s.redo);
  const historyIndex = useEditorStore((s: any) => s.historyIndex);
  const historyLength = useEditorStore((s: any) => s.history.length);
  const isDarkMode = useEditorStore((s: any) => s.isDarkMode);
  const toggleDarkMode = useEditorStore((s: any) => s.toggleDarkMode);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const snapToGridEnabled = useEditorStore((s: any) => s.snapToGridEnabled);
  const toggleSnapToGrid = useEditorStore((s: any) => s.toggleSnapToGrid);
  const togglePresentationMode = useEditorStore((s: any) => s.togglePresentationMode);
  const userMode = useEditorStore((s: any) => s.userMode);
  const setUserMode = useEditorStore((s: any) => s.setUserMode);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);
  const resetViewport = useEditorStore((s: any) => s.resetViewport);

  const saveStatus = useProjectStore((s: any) => s.saveStatus);

  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) {
      useProjectStore.getState().updateActiveSnapshot(snapshot);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) {
      useProjectStore.getState().updateActiveSnapshot(snapshot);
    }
  }, [redo]);

  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <header className="h-topbar flex items-center gap-3 px-3 bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)] rounded-2xl z-30 select-none">
      {/* Left Section: Logo & Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#ffd400] border-2 border-black flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-[3px_3px_0_#121212]">
              <span className="text-black font-black text-lg italic tracking-tighter">TF</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-retro-burgundy border-2 border-white dark:border-surface-900 shadow-sm" />
          </div>
          <div>
            <h1 className="text-[13px] font-black font-display text-retro-ink dark:text-white leading-none tracking-tight">
               TACTIC<span className="text-retro-mustard">FLOW</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-surface-500 uppercase tracking-wider truncate max-w-[120px]">
                {saveStatus === 'saved' ? 'Untitled Project' : 'Drafting...'}
              </span>
              {saveStatus === 'saved' && <CloudCheck className="w-3 h-3 text-grass-600" />}
            </div>
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-8 mx-2" />
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg"
            onClick={handleRedo}
            disabled={historyIndex >= historyLength - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center Section: Mode Toggles */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <div className="flex items-center bg-white dark:bg-surface-800 p-1 rounded-xl border-2 border-black dark:border-surface-500 overflow-x-auto scrollbar-hide max-w-[46vw] shadow-[3px_3px_0_#121212] dark:shadow-[3px_3px_0_rgba(255,255,255,0.15)]">

        <div className="flex items-center px-1.5">
           {['coach', 'creator', 'analyst'].map((mode) => (
            <button
              key={mode}
              onClick={() => setUserMode(mode as any)}
              className={cn(
                "px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all whitespace-nowrap",
                userMode === mode 
                  ? "bg-white dark:bg-surface-700 shadow-material-1 text-retro-ink dark:text-white scale-105" 
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              )}
            >
              {mode}
            </button>
           ))}
        </div>
      </div>
      </div>

      {/* Right Section: Utilities & Export */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 mr-1">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetViewport} className="h-9 w-9">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        <FormationDropdown />
        <SettingsDropdown />

        <div className="w-px h-8 bg-surface-300 mx-1" />

        <Button 
          variant="ghost" 
          className="h-10 px-3 rounded-xl font-black text-[11px] uppercase tracking-wide"
          onClick={togglePresentationMode}
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Present
        </Button>

        <Button 
          variant="retro" 
          className="h-10 px-4 rounded-xl"
          onClick={() => setIsExportOpen(true)}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {isExportOpen && (
        <ExportModal onClose={() => setIsExportOpen(false)} />
      )}
    </header>
  );
};
