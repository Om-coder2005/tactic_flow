// ============================================
// TacticFlow — Editor Store
// Controls tool selection, canvas mode, undo/redo, viewport
// Uses subscribeWithSelector per zustand-store-ts skill
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { produce } from 'immer';
import type { BoardSnapshot, PitchTheme } from '@/types';

// ---------- Tool types ----------

export type ToolType =
  | 'select'
  | 'player'
  | 'goalkeeper'
  | 'ball'
  | 'pencil'
  | 'arrow'
  | 'curved_arrow'
  | 'dashed_arrow'
  | 'dashed_curved'
  | 'shape'
  | 'zone'
  | 'text'
  | 'callout'
  | 'eraser'
  | 'cone'
  | 'ladder'
  | 'mini_goal'
  | 'mannequin';

export type CanvasMode = 'select' | 'draw';

// ---------- State / Actions separation ----------

export interface EditorState {
  activeTool: ToolType;
  selectedObjectIds: string[];
  canvasMode: CanvasMode;
  history: BoardSnapshot[];
  historyIndex: number;
  pitchTheme: PitchTheme;
  isDarkMode: boolean;
  gridEnabled: boolean;
  snapToGridEnabled: boolean;
  isPresenting: boolean;
  spotlightEnabled: boolean;
  zoom: number;
  panX: number;
  panY: number;
  userMode: 'coach' | 'creator' | 'analyst';
  pitchZoneOverlay: 'none' | 'thirds' | '18_zones' | '5_vertical_lanes';
  previewFormation: {
    templateId: string;
    team: 'home' | 'away';
    nodes: { role: string; x: number; y: number }[];
  } | null;
}

export interface EditorActions {
  setTool: (tool: ToolType) => void;
  selectObjects: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  deselectAll: () => void;
  pushHistory: (snapshot: BoardSnapshot) => void;
  undo: () => BoardSnapshot | null;
  redo: () => BoardSnapshot | null;
  setPitchTheme: (theme: PitchTheme) => void;
  toggleDarkMode: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  togglePresentationMode: () => void;
  toggleSpotlight: () => void;
  setViewport: (zoom: number, x: number, y: number) => void;
  resetViewport: () => void;
  setUserMode: (mode: 'coach' | 'creator' | 'analyst') => void;
  setPitchZoneOverlay: (overlay: 'none' | 'thirds' | '18_zones' | '5_vertical_lanes') => void;
  setPreviewFormation: (preview: { templateId: string; team: 'home' | 'away'; nodes: { role: string; x: number; y: number }[] } | null) => void;
}

export type EditorStore = EditorState & EditorActions;

const INITIAL_STATE: EditorState = {
  activeTool: 'select',
  selectedObjectIds: [],
  canvasMode: 'select',
  history: [],
  historyIndex: -1,
  pitchTheme: 'classic_green',
  isDarkMode: false,
  gridEnabled: false,
  snapToGridEnabled: false,
  isPresenting: false,
  spotlightEnabled: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  userMode: 'analyst',
  pitchZoneOverlay: 'none',
  previewFormation: null,
};

// Determine canvas mode from tool
function modeForTool(tool: ToolType): CanvasMode {
  return tool === 'select' || tool === 'eraser' ? 'select' : 'draw';
}

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    setTool: (tool) =>
      set({ activeTool: tool, canvasMode: modeForTool(tool) }),

    selectObjects: (ids) => set({ selectedObjectIds: ids }),

    addToSelection: (id) =>
      set(
        produce((state: EditorState) => {
          if (!state.selectedObjectIds.includes(id)) {
            state.selectedObjectIds.push(id);
          }
        })
      ),

    deselectAll: () => set({ selectedObjectIds: [] }),

    pushHistory: (snapshot) =>
      set(
        produce((state: EditorState) => {
          // Truncate any redo history ahead of current index
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot);
          state.historyIndex = state.history.length - 1;
        })
      ),

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex <= 0) return null;
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex });
      return history[newIndex] ?? null;
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 1) return null;
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      return history[newIndex] ?? null;
    },

    setPitchTheme: (theme) => set({ pitchTheme: theme }),

    toggleDarkMode: () =>
      set((state) => {
        const next = !state.isDarkMode;
        document.documentElement.classList.toggle('dark', next);
        return { isDarkMode: next };
      }),

    toggleGrid: () =>
      set((state) => ({ gridEnabled: !state.gridEnabled })),

    toggleSnapToGrid: () =>
      set((state) => ({ snapToGridEnabled: !state.snapToGridEnabled })),
      
    togglePresentationMode: () =>
      set((state) => ({ isPresenting: !state.isPresenting })),
      
    toggleSpotlight: () =>
      set((state) => ({ spotlightEnabled: !state.spotlightEnabled })),
      
    setViewport: (zoom, x, y) => set({ zoom, panX: x, panY: y }),
    
    resetViewport: () => set({ zoom: 1, panX: 0, panY: 0 }),
      
    setUserMode: (mode) => set({ userMode: mode }),
    
    setPitchZoneOverlay: (overlay) => set({ pitchZoneOverlay: overlay }),

    setPreviewFormation: (preview) => set({ previewFormation: preview }),
  }))
);
