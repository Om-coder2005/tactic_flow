import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const editor = useEditorStore.getState();
      const project = useProjectStore.getState();

      // Ctrl+Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (editor.isPresenting) return;
        e.preventDefault();
        const snapshot = editor.undo();
        if (snapshot) project.updateActiveSnapshot(snapshot);
      }
      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        if (editor.isPresenting) return;
        e.preventDefault();
        const snapshot = editor.redo();
        if (snapshot) project.updateActiveSnapshot(snapshot);
      }
      // Delete / Backspace — Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.isPresenting) return;
        const ids = editor.selectedObjectIds;
        const isInputSelected = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
        
        if (ids.length > 0 && !isInputSelected) {
          e.preventDefault();
          const snap = project.getActiveSnapshot();
          if (snap) editor.pushHistory(structuredClone(snap));
          project.deleteObjects(ids);
          editor.deselectAll();
        }
      }
      // Escape — Deselect all, Exit Presentation, or cancel formation placement
      if (e.key === 'Escape') {
        if (editor.isPresenting) {
          editor.togglePresentationMode();
        } else if (editor.previewFormation) {
          editor.setPreviewFormation(null);
        } else {
          editor.deselectAll();
        }
      }
      // Ctrl+D — Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        if (editor.isPresenting) return;
        const ids = editor.selectedObjectIds;
        if (ids.length > 0) {
          e.preventDefault();
          const snap = project.getActiveSnapshot();
          if (snap) editor.pushHistory(structuredClone(snap));
          const dups = project.duplicateObjects(ids);
          editor.selectObjects(dups.map((d: any) => d.id));
        }
      }
      // Ctrl+A — Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        if (editor.isPresenting) return;
        e.preventDefault();
        const snap = project.getActiveSnapshot();
        if (snap) {
          editor.selectObjects(snap.objects.map((o: any) => o.id));
        }
      }

      // Presentation mode navigation
      if (editor.isPresenting) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          const currentIndex = project.frames.findIndex((f) => f.id === project.activeFrameId);
          if (currentIndex >= 0 && currentIndex < project.frames.length - 1) {
            const nextFrame = project.frames[currentIndex + 1];
            if (nextFrame) project.setActiveFrame(nextFrame.id);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const currentIndex = project.frames.findIndex((f) => f.id === project.activeFrameId);
          if (currentIndex > 0) {
            const prevFrame = project.frames[currentIndex - 1];
            if (prevFrame) project.setActiveFrame(prevFrame.id);
          }
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          editor.toggleSpotlight();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
