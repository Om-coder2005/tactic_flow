// ============================================
// TacticFlow — Project Store
// Manages project data, board objects, frames, autosave status
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  TacticalObject,
  BoardSnapshot,
  Frame,
  Project,
  Board,
  PitchType,
  PitchTheme,
} from '@/types';

// ---------- State / Actions ----------

export type SaveStatus = 'saved' | 'saving' | 'error' | 'conflict' | 'unsaved';

export interface ProjectState {
  currentProject: Project | null;
  board: Board | null;
  frames: Frame[];
  activeFrameId: string | null;
  isDirty: boolean;
  saveStatus: SaveStatus;
  savedFormations: Record<string, TacticalObject[]>;
}

export interface ProjectActions {
  // ...
  saveFormation: (name: string, objects: TacticalObject[]) => void;
  deleteFormation: (name: string) => void;
}

export interface ProjectActions {
  // Project
  setProject: (project: Project) => void;
  setBoard: (board: Board) => void;
  resetProject: () => void;

  // Frame management
  setFrames: (frames: Frame[]) => void;
  setActiveFrame: (frameId: string) => void;
  addFrame: (afterFrameId?: string) => Frame;
  duplicateFrame: (frameId: string) => Frame | null;
  deleteFrame: (frameId: string) => boolean;
  updateFrameMeta: (
    frameId: string,
    updates: Partial<Pick<Frame, 'name' | 'phase_label' | 'duration_ms'>>
  ) => void;
  reorderFrame: (frameId: string, newIndex: number) => void;

  // Object operations on active frame
  getActiveSnapshot: () => BoardSnapshot | null;
  addObject: (obj: TacticalObject) => void;
  updateObject: (id: string, updates: Partial<TacticalObject>) => void;
  updateObjects: (updates: { id: string; updates: Partial<TacticalObject> }[]) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => TacticalObject[];
  updateActiveSnapshot: (snapshot: BoardSnapshot) => void;

  // Save
  markDirty: () => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export type ProjectStore = ProjectState & ProjectActions;

function createEmptySnapshot(
  pitchType: PitchType = 'full',
  theme: PitchTheme = 'classic_green'
): BoardSnapshot {
  return {
    schema_version: 1,
    pitch_type: pitchType,
    theme,
    objects: [],
  };
}

function createDefaultFrame(
  projectId: string,
  orderIndex: number,
  pitchType: PitchType = 'full',
  theme: PitchTheme = 'classic_green'
): Frame {
  return {
    id: uuidv4(),
    project_id: projectId,
    name: `Frame ${orderIndex + 1}`,
    phase_label: null,
    order_index: orderIndex,
    duration_ms: 1800,
    snapshot: createEmptySnapshot(pitchType, theme),
  };
}

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector((set, get) => ({
    currentProject: null,
    board: null,
    frames: [],
    activeFrameId: null,
    savedFormations: {},
    isDirty: false,
    saveStatus: 'saved' as SaveStatus,

    saveFormation: (name, objects) => 
      set(produce((s: ProjectState) => {
        s.savedFormations[name] = structuredClone(objects);
      })),
    deleteFormation: (name) =>
      set(produce((s: ProjectState) => {
        delete s.savedFormations[name];
      })),

    setProject: (project) => set({ currentProject: project }),
    setBoard: (board) => set({ board }),
    resetProject: () => set({ currentProject: null, board: null, frames: [], activeFrameId: null, isDirty: false, saveStatus: 'saved' }),

    setFrames: (frames) => {
      set({ frames });
      // Auto-select first frame if none active
      const current = get().activeFrameId;
      if (!current && frames.length > 0) {
        set({ activeFrameId: frames[0]!.id });
      }
    },

    setActiveFrame: (frameId) => set({ activeFrameId: frameId }),

    addFrame: (afterFrameId) => {
      const state = get();
      const projectId = state.currentProject?.id ?? 'local';
      const pitchType = state.currentProject?.pitch_type ?? 'full';
      const theme = state.currentProject?.theme ?? 'classic_green';

      let insertIndex = state.frames.length;
      let sourceFrame = state.frames[state.frames.length - 1]; // Default to last
      
      if (afterFrameId) {
        const afterIdx = state.frames.findIndex((f) => f.id === afterFrameId);
        if (afterIdx >= 0) {
          insertIndex = afterIdx + 1;
          sourceFrame = state.frames[afterIdx];
        }
      }

      const newFrame = createDefaultFrame(projectId, insertIndex, pitchType, theme);
      
      // Carry over snapshot if source exists
      if (sourceFrame) {
        newFrame.snapshot = structuredClone(sourceFrame.snapshot);
      }

      set(
        produce((s: ProjectState) => {
          s.frames.splice(insertIndex, 0, newFrame);
          // Reindex
          s.frames.forEach((f, i) => {
            f.order_index = i;
          });
          s.activeFrameId = newFrame.id;
          s.isDirty = true;
          s.saveStatus = 'unsaved';
        })
      );

      return newFrame;
    },

    duplicateFrame: (frameId) => {
      const state = get();
      const source = state.frames.find((f) => f.id === frameId);
      if (!source) return null;

      const insertIndex = source.order_index + 1;
      const duplicate: Frame = {
        ...structuredClone(source),
        id: uuidv4(),
        name: `${source.name} (copy)`,
        order_index: insertIndex,
      };

      set(
        produce((s: ProjectState) => {
          s.frames.splice(insertIndex, 0, duplicate);
          s.frames.forEach((f, i) => {
            f.order_index = i;
          });
          s.activeFrameId = duplicate.id;
          s.isDirty = true;
        })
      );

      return duplicate;
    },

    deleteFrame: (frameId) => {
      const state = get();
      if (state.frames.length <= 1) return false; // Cannot delete last frame

      set(
        produce((s: ProjectState) => {
          const idx = s.frames.findIndex((f) => f.id === frameId);
          if (idx < 0) return;
          s.frames.splice(idx, 1);
          s.frames.forEach((f, i) => {
            f.order_index = i;
          });
          // If deleted was active, select nearest
          if (s.activeFrameId === frameId) {
            const newIdx = Math.min(idx, s.frames.length - 1);
            s.activeFrameId = s.frames[newIdx]?.id ?? null;
          }
          s.isDirty = true;
        })
      );

      return true;
    },

    updateFrameMeta: (frameId, updates) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === frameId);
          if (!frame) return;
          Object.assign(frame, updates);
          s.isDirty = true;
        })
      ),

    reorderFrame: (frameId, newIndex) =>
      set(
        produce((s: ProjectState) => {
          const oldIdx = s.frames.findIndex((f) => f.id === frameId);
          if (oldIdx < 0 || newIndex < 0 || newIndex >= s.frames.length) return;
          const [moved] = s.frames.splice(oldIdx, 1);
          if (moved) {
            s.frames.splice(newIndex, 0, moved);
            s.frames.forEach((f, i) => {
              f.order_index = i;
            });
            s.isDirty = true;
          }
        })
      ),

    getActiveSnapshot: () => {
      const { frames, activeFrameId } = get();
      const frame = frames.find((f) => f.id === activeFrameId);
      return frame?.snapshot ?? null;
    },

    addObject: (obj) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;
          frame.snapshot.objects.push(obj);
          s.isDirty = true;
        })
      ),

    updateObject: (id, updates) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;
          const obj = frame.snapshot.objects.find((o) => o.id === id);
          if (!obj) return;
          Object.assign(obj, updates);
          s.isDirty = true;

          // Magnetized Arrow Sync
          if ('x' in updates || 'y' in updates) {
            frame.snapshot.objects.forEach((o: any) => {
              if (o.type.includes('arrow')) {
                if (o.from_id === id) {
                  o.from_x = obj.x;
                  o.from_y = obj.y;
                }
                if (o.to_id === id) {
                  o.to_x = obj.x;
                  o.to_y = obj.y;
                }
              }
            });
          }
        })
      ),

    updateObjects: (batchUpdates) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;

          for (const { id, updates } of batchUpdates) {
            const obj = frame.snapshot.objects.find((o) => o.id === id);
            if (!obj) continue;
            Object.assign(obj, updates);

            // Magnetized Arrow Sync
            if ('x' in updates || 'y' in updates) {
              frame.snapshot.objects.forEach((o: any) => {
                if (o.type.includes('arrow')) {
                  if (o.from_id === id) {
                    o.from_x = obj.x;
                    o.from_y = obj.y;
                  }
                  if (o.to_id === id) {
                    o.to_x = obj.x;
                    o.to_y = obj.y;
                  }
                }
              });
            }
          }
          s.isDirty = true;
        })
      ),

    deleteObjects: (ids) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;
          const idSet = new Set(ids);
          frame.snapshot.objects = frame.snapshot.objects.filter(
            (o) => !idSet.has(o.id)
          );
          s.isDirty = true;
        })
      ),

    duplicateObjects: (ids) => {
      const duplicates: TacticalObject[] = [];

      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;
          const idSet = new Set(ids);
          const originals = frame.snapshot.objects.filter((o) => idSet.has(o.id));

          for (const orig of originals) {
            const dup = structuredClone(orig);
            dup.id = uuidv4();
            // Offset slightly so the duplicate is visible
            dup.x = Math.min(100, dup.x + 3);
            dup.y = Math.min(100, dup.y + 3);
            frame.snapshot.objects.push(dup);
            duplicates.push(dup);
          }
          s.isDirty = true;
        })
      );

      return duplicates;
    },

    updateActiveSnapshot: (snapshot) =>
      set(
        produce((s: ProjectState) => {
          const frame = s.frames.find((f) => f.id === s.activeFrameId);
          if (!frame) return;
          frame.snapshot = snapshot;
          s.isDirty = true;
        })
      ),

    markDirty: () => set({ isDirty: true, saveStatus: 'unsaved' }),
    setSaveStatus: (status) => set({ saveStatus: status }),
  }))
);
