import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { FormationDropdown } from '@/components/FormationDropdown';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { ExportModal } from '@/features/export/ExportModal';
import { 
  ArrowLeft,
  Undo2, 
  Redo2, 
  Play, 
  Download, 
  CloudCheck, 
  CloudAlert, 
  Maximize
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const undo = useEditorStore((s: any) => s.undo);
  const redo = useEditorStore((s: any) => s.redo);
  const historyIndex = useEditorStore((s: any) => s.historyIndex);
  const historyLength = useEditorStore((s: any) => s.history.length);
  const togglePresentationMode = useEditorStore((s: any) => s.togglePresentationMode);
  const userMode = useEditorStore((s: any) => s.userMode);
  const setUserMode = useEditorStore((s: any) => s.setUserMode);
  const resetViewport = useEditorStore((s: any) => s.resetViewport);

  const currentProject = useProjectStore((s: any) => s.currentProject);
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
    <header className="h-12 flex items-center justify-between gap-3 px-3 bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl z-30 select-none">
      {/* Left Section: Back to Boards + Brand + Project Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => navigate('/boards')}
          className="p-1.5 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] transition-all flex items-center justify-center border border-[#e2e4df]"
          title="Back to Projects"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#15803d]/10 border border-[#15803d]/30 flex items-center justify-center text-[#15803d] font-black text-xs tracking-tighter">
            TF
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black tracking-tight text-[#1f2421] leading-none flex items-center gap-1.5">
              TACTIC<span className="text-[#15803d]">FLOW</span>
            </h1>
            <span className="text-[10px] font-semibold text-[#5c635e] truncate max-w-[140px] leading-tight">
              {currentProject?.title || 'Untitled Board'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section: Tactical Role Mode Selector */}
      <div className="flex items-center bg-[#f4f5f1] p-1 rounded-xl border border-[#e2e4df]">
        {(['coach', 'creator', 'analyst'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setUserMode(mode)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all whitespace-nowrap",
              userMode === mode
                ? "bg-white text-[#15803d] shadow-sm border border-[#d0d3c9]"
                : "text-[#5c635e] hover:text-[#1f2421]"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right Section: Save status, History, Presentation, Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Save Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f5f1] border border-[#e2e4df] text-[10px] font-semibold text-[#5c635e]">
          {saveStatus === 'saved' ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-[#15803d]" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <CloudAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-[#e2e4df] mx-0.5" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= historyLength - 1}
            className="p-1.5 rounded-lg text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={resetViewport}
            className="p-1.5 rounded-lg text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] transition-colors"
            title="Reset Zoom / Viewport"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#e2e4df] mx-0.5" />

        <FormationDropdown />
        <SettingsDropdown />

        {/* Present & Export */}
        <button
          onClick={togglePresentationMode}
          className="px-3 py-1.5 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] border border-[#e2e4df] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#15803d]" />
          <span>Present</span>
        </button>

        <button
          onClick={() => setIsExportOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {isExportOpen && (
        <ExportModal onClose={() => setIsExportOpen(false)} />
      )}
    </header>
  );
};


