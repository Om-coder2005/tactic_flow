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
    <header className="h-12 sm:h-13 flex items-center justify-between gap-1 sm:gap-3 px-2 sm:px-3 bg-[#161A17] border border-[#242A25] shadow-md rounded-2xl z-30 select-none text-[#E8ECE9]">
      {/* Left Section: Back to Boards + Brand + Project Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => navigate('/boards')}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] transition-all flex items-center justify-center border border-[#333a34] shrink-0 touch-manipulation"
          title="Back to Projects"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center">
          {/* Brand Icon (logo.png) */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 object-contain shrink-0 mr-1" 
          />
          {/* Desktop/Mobile Brand Name (name_logo.png) & Project Name */}
          <div className="flex items-center gap-1.5">
            <img 
              src="/name_logo.png" 
              alt="SwitchPlay" 
              className="h-3 sm:h-3.5 w-auto object-contain shrink-0" 
            />
            <div className="hidden md:flex flex-col border-l border-[#242A25] pl-2 ml-1">
              <span className="text-[10px] font-semibold text-[#8A918B] truncate max-w-[140px] leading-tight">
                {currentProject?.title || 'Untitled Board'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Desktop Save Status Badge */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#242A25] border border-[#333a34] text-[10px] font-semibold text-[#8A918B]">
          {saveStatus === 'saved' ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-[#55AA55]" />
              <span className="text-[#E8ECE9]">Saved</span>
            </>
          ) : (
            <>
              <CloudAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-amber-400">Saving...</span>
            </>
          )}
        </div>

        {/* Desktop Undo / Redo */}
        <div className="hidden md:flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A918B] hover:text-[#E8ECE9] hover:bg-[#242A25] disabled:opacity-30 disabled:hover:text-[#8A918B] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= historyLength - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A918B] hover:text-[#E8ECE9] hover:bg-[#242A25] disabled:opacity-30 disabled:hover:text-[#8A918B] transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#242A25] mx-0.5 hidden md:block" />

        {/* 2. Formations */}
        <div className="hidden md:flex items-center">
          <FormationDropdown />
        </div>
        <button
          onClick={() => useEditorStore.getState().toggleMobileFormations()}
          className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] border border-[#333a34] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm touch-manipulation shrink-0"
          title="Formations"
        >
          <Users className="w-3.5 h-3.5 text-[#55AA55]" />
          <span className="text-[10px]">FORMATIONS</span>
        </button>

        {/* Overlays (Desktop Dropdown) */}
        <div className="hidden md:flex items-center">
          <OverlaysDropdown />
        </div>

        {/* 3. Settings Icon Dropdown */}
        <div className="hidden md:flex items-center">
          <SettingsDropdown />
        </div>
        <button
          onClick={() => useEditorStore.getState().toggleMobileSettings()}
          className="md:hidden w-8 h-8 rounded-xl bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] border border-[#333a34] flex items-center justify-center transition-all shadow-sm touch-manipulation shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-[#8A918B]" />
        </button>

        {/* 4. Present Icon Button */}
        <button
          onClick={togglePresentationMode}
          className="w-9 h-9 sm:w-auto px-2 sm:px-3 py-1.5 rounded-xl bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] border border-[#333a34] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm touch-manipulation"
          title="Present Mode"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#55AA55]" />
          <span className="hidden md:inline">Present</span>
        </button>

        {/* 5. Export Icon Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="w-9 h-9 sm:w-auto px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#55AA55] hover:bg-[#449944] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm touch-manipulation"
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


