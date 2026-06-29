import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { tacticService } from '@/services/tacticService';
import { v4 as uuidv4 } from 'uuid';
import type { Frame } from '@/types';

const STORAGE_KEY_PROJECT_ID = 'tf_active_project_id';

export function useAutoSave() {
  const isDirty = useProjectStore((s) => s.isDirty);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isDirty) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      const state = useProjectStore.getState();
      const setSaveStatus = state.setSaveStatus;

      try {
        setSaveStatus('saving');

        let projectId = state.currentProject?.id;

        // ─── Bootstrap project once on first ever save ───────────────────────
        if (!projectId || projectId === 'local-draft') {
          const freshProject = await tacticService.createProject(
            'Untitled Selection',
            (state.frames[0]?.snapshot?.pitch_type as string) || 'full'
          );
          projectId = freshProject.id as string;

          // Persist project_id so next refresh reuses the same project
          localStorage.setItem(STORAGE_KEY_PROJECT_ID, projectId);

          state.setProject(freshProject);
          if (freshProject.board) state.setBoard(freshProject.board);

          // Re-map all local frames to the real backend project_id
          const remapped = state.frames.map(f => ({ ...f, project_id: projectId! }));
          state.setFrames(remapped);
        }

        const framesToSave = state.frames.map(f => ({
          id: f.id,
          name: f.name,
          phase_label: f.phase_label,
          duration_ms: f.duration_ms,
          snapshot: f.snapshot,
          version: f.version, // Required for OCC
        }));

        // Clear isDirty before network request to capture edits made during flight
        useProjectStore.setState({ isDirty: false });

        // ─── Sync all frames in batch for consistency ────────────────────────
        const syncedFrames = await tacticService.batchUpdateFrames(projectId!, framesToSave);

        // Update local state with whatever the server returned (just in case of IDs or defaults)
        if (syncedFrames && syncedFrames.length > 0) {
           useProjectStore.setState((currentState) => {
             const newFrames = currentState.frames.map(localFrame => {
               const sf = syncedFrames.find(s => s.id === localFrame.id || s.name === localFrame.name);
               if (sf) {
                 return {
                   ...localFrame,
                   id: sf.id,
                   version: sf.version,
                   project_id: sf.project_id
                 };
               }
               return localFrame;
             });
             
             return { frames: newFrames, saveStatus: 'saved' };
           });
        }
        
      } catch (err: any) {
        console.error('AutoSave Error', err);
        const isConflict = err?.message === 'STALE_WRITE' || err?.data?.detail?.code === 'STALE_WRITE';
        useProjectStore.setState({ isDirty: true }); // Restore dirty on error
        setSaveStatus(isConflict ? 'conflict' : 'error');
      }
    }, 2000);

  }, [isDirty, isAuthenticated]);
}

/** Called once on app mount — restores last active project from localStorage. */
export async function restoreProjectFromStorage(): Promise<boolean> {
  const savedId = localStorage.getItem(STORAGE_KEY_PROJECT_ID);
  if (!savedId) return false;

  try {
    const project = await tacticService.getProject(savedId);
    if (!project) {
      localStorage.removeItem(STORAGE_KEY_PROJECT_ID);
      return false;
    }

    const store = useProjectStore.getState();
    store.setProject(project);
    if (project.board) store.setBoard(project.board);
    if (project.frames && project.frames.length > 0) {
      store.setFrames(project.frames);
    } else {
      // Ensure editor always has an active snapshot to edit against.
      const bootstrapFrame: Frame = {
        id: uuidv4(),
        project_id: project.id,
        name: 'Frame 1',
        phase_label: null,
        order_index: 0,
        duration_ms: 1800,
        snapshot: {
          schema_version: 1,
          pitch_type: project.pitch_type ?? 'full',
          theme: project.theme ?? 'classic_green',
          objects: [],
        },
      };
      store.setFrames([bootstrapFrame]);
      store.setActiveFrame(bootstrapFrame.id);
    }
    return true;
  } catch {
    // Project deleted or server unreachable — start fresh
    localStorage.removeItem(STORAGE_KEY_PROJECT_ID);
    return false;
  }
}
