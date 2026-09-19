import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { FormationDropdown } from '@/components/FormationDropdown';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { OverlaysDropdown } from '@/components/OverlaysDropdown';
import { ExportModal } from '@/features/export/ExportModal';
import { 
  ArrowLeft,
  Undo2, 
  Redo2, 
  Play, 
  Download, 
  CloudCheck, 
  CloudAlert, 
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const undo = useEditorStore((s: any) => s.undo);
  const redo = useEditorStore((s: any) => s.redo);
  const historyIndex = useEditorStore((s: any) => s.historyIndex);
  const historyLength = useEditorStore((s: any) => s.history.length);
  const togglePresentationMode = useEditorStore((s: any) => s.togglePresentationMode);
  const resetViewport = useEditorStore((s: any) => s.resetViewport);
  const toggleInspector = useEditorStore((s: any) => s.toggleInspector);
  const isInspectorOpen = useEditorStore((s: any) => s.isInspectorOpen);

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
    <header className="h-12 sm:h-13 flex items-center justify-between gap-1 sm:gap-3 px-2 sm:px-3 bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl z-30 select-none">
      {/* Left Section: Back to Boards + Brand + Project Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => navigate('/boards')}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] transition-all flex items-center justify-center border border-[#e2e4df] shrink-0 touch-manipulation"
          title="Back to Projects"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#15803d]/10 border border-[#15803d]/30 flex items-center justify-center text-[#15803d] font-black text-xs tracking-tighter shrink-0">
            TF
          </div>
          {/* Desktop Title & Project Name (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col">
            <h1 className="text-xs font-black tracking-tight text-[#1f2421] leading-none flex items-center gap-1">
              TACTIC<span className="text-[#15803d]">FLOW</span>
            </h1>
            <span className="text-[10px] font-semibold text-[#5c635e] truncate max-w-[140px] leading-tight">
              {currentProject?.title || 'Untitled Board'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Desktop Save Status Badge */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f4f5f1] border border-[#e2e4df] text-[10px] font-semibold text-[#5c635e]">
          {saveStatus === 'saved' ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-[#15803d]" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <CloudAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Saving...</span>
            </>
          )}
        </div>

        {/* Desktop Undo / Redo (Hidden on Mobile, placed in Bottom Dock on Mobile) */}
        <div className="hidden md:flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= historyLength - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#e2e4df] mx-0.5 hidden md:block" />

        {/* 2. Formations (Desktop dropdown / Mobile drawer button) */}
        <div className="hidden md:flex items-center">
          <FormationDropdown />
        </div>
        <button
          onClick={() => useEditorStore.getState().toggleMobileFormations()}
          className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] border border-[#e2e4df] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm touch-manipulation shrink-0"
          title="Formations"
        >
          <Users className="w-3.5 h-3.5 text-[#15803d]" />
          <span className="text-[10px]">FORMATIONS</span>
        </button>

        {/* Overlays (Desktop Dropdown) */}
        <div className="hidden md:flex items-center">
          <OverlaysDropdown />
        </div>

        {/* 3. Settings Icon Dropdown (Desktop dropdown / Mobile drawer button) */}
        <div className="hidden md:flex items-center">
          <SettingsDropdown />
        </div>
        <button
          onClick={() => useEditorStore.getState().toggleMobileSettings()}
          className="md:hidden w-8 h-8 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] border border-[#e2e4df] flex items-center justify-center transition-all shadow-sm touch-manipulation shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-[#5c635e]" />
        </button>

        {/* 4. Present Icon Button */}
        <button
          onClick={togglePresentationMode}
          className="w-9 h-9 sm:w-auto px-2 sm:px-3 py-1.5 rounded-xl bg-[#f4f5f1] hover:bg-[#eaebe6] text-[#1f2421] border border-[#e2e4df] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm touch-manipulation"
          title="Present Mode"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#15803d]" />
          <span className="hidden md:inline">Present</span>
        </button>

        {/* 5. Export Icon Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="w-9 h-9 sm:w-auto px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm touch-manipulation"
          title="Export Visuals"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>
      </div>

      {isExportOpen && (
        <ExportModal onClose={() => setIsExportOpen(false)} />
      )}
    </header>
  );
};


