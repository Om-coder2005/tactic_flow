import { create } from 'zustand';
import type { TacticalObject } from '@/types';
import { useProjectStore } from '@/stores/projectStore';
import gsap from 'gsap';

export type PlaybackObject = TacticalObject & { _opacity?: number };

interface PlaybackState {
  isPlaying: boolean;
  interpolatedObjects: PlaybackObject[] | null;
  currentFrameIndex: number;
}

interface PlaybackActions {
  setPlaying: (playing: boolean) => void;
  setInterpolatedObjects: (objects: PlaybackObject[] | null) => void;
  animateObjectUpdates: (updates: { id: string; updates: any }[]) => void;
  playSequence: () => void;
  stopSequence: () => void;
}

export type PlaybackStore = PlaybackState & PlaybackActions;

let playbackTimeline: gsap.core.Timeline | null = null;

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  isPlaying: false,
  interpolatedObjects: null,
  currentFrameIndex: 0,
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  setInterpolatedObjects: (objects) => set({ interpolatedObjects: objects }),

  playSequence: () => {
    const { frames } = useProjectStore.getState();
    if (frames.length < 2) return;

    // Stop existing
    if (playbackTimeline) playbackTimeline.kill();
    
    set({ isPlaying: true, interpolatedObjects: null });

    const tl = gsap.timeline({
      onComplete: () => {
        set({ isPlaying: false, interpolatedObjects: null });
        playbackTimeline = null;
      }
    });

    playbackTimeline = tl;

    frames.forEach((frame, i) => {
      if (i === frames.length - 1) return;
      const nextFrame = frames[i + 1];
      if (!nextFrame) return;

      const duration = (frame.duration_ms || 1000) / 1000;

      // Animate from current frame to next
      const frameProxy = { progress: 0 };
      
      tl.to(frameProxy, {
        progress: 1,
        duration: duration,
        ease: "power3.inOut",
        onStart: () => {
          set({ currentFrameIndex: i });
          useProjectStore.getState().setActiveFrame(frame.id);
        },
        onUpdate: () => {
          const p = frameProxy.progress;
          const interpolated: PlaybackObject[] = [];

          // Match objects by ID
          const currentObjs = frame.snapshot.objects;
          const nextObjs = nextFrame.snapshot.objects;

          // We handle three cases:
          // 1. Object in both: Interpolate x, y, rotation
          // 2. Object in current only: Fade out
          // 3. Object in next only: Fade in

          const nextObjMap = new Map(nextObjs.map(o => [o.id, o]));
          const currentObjIds = new Set(currentObjs.map(o => o.id));

          currentObjs.forEach(obj => {
            const next = nextObjMap.get(obj.id);
            if (next) {
              // Interpolate
              const interpolatedObj: any = {
                ...obj,
                x: obj.x + (next.x - obj.x) * p,
                y: obj.y + (next.y - obj.y) * p,
                rotation: (obj.rotation || 0) + ((next.rotation || 0) - (obj.rotation || 0)) * p,
                _opacity: 1
              };
              
              if ('from_x' in obj && 'from_x' in next) {
                interpolatedObj.from_x = (obj as any).from_x + ((next as any).from_x - (obj as any).from_x) * p;
                interpolatedObj.from_y = (obj as any).from_y + ((next as any).from_y - (obj as any).from_y) * p;
                interpolatedObj.to_x = (obj as any).to_x + ((next as any).to_x - (obj as any).to_x) * p;
                interpolatedObj.to_y = (obj as any).to_y + ((next as any).to_y - (obj as any).to_y) * p;
              }
              if ('width' in obj && 'width' in next) {
                interpolatedObj.width = (obj as any).width + ((next as any).width - (obj as any).width) * p;
                interpolatedObj.height = (obj as any).height + ((next as any).height - (obj as any).height) * p;
              }
              if ('bend_x' in obj && 'bend_x' in next && (obj as any).bend_x !== null && (next as any).bend_x !== null) {
                interpolatedObj.bend_x = (obj as any).bend_x + ((next as any).bend_x - (obj as any).bend_x) * p;
                interpolatedObj.bend_y = (obj as any).bend_y + ((next as any).bend_y - (obj as any).bend_y) * p;
              }
              
              interpolated.push(interpolatedObj);
            } else {
              // Fade out
              interpolated.push({
                ...obj,
                _opacity: 1 - p
              });
            }
          });

          nextObjs.forEach(obj => {
            if (!currentObjIds.has(obj.id)) {
              // Fade in
              interpolated.push({
                ...obj,
                _opacity: p
              });
            }
          });

          set({ interpolatedObjects: interpolated });
        }
      });
    });
  },

  animateObjectUpdates: (batchUpdates) => {
    const { getActiveSnapshot } = useProjectStore.getState();
    const snap = getActiveSnapshot();
    if (!snap) return;

    // We use isPlaying and interpolatedObjects to override the static render in PitchStage
    set({ isPlaying: true });

    const currentObjs = structuredClone(snap.objects);
    const updateMap = new Map(batchUpdates.map(u => [u.id, u.updates]));

    const frameProxy = { progress: 0 };
    gsap.to(frameProxy, {
      progress: 1,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => {
        const p = frameProxy.progress;
        const interpolated = currentObjs.map(obj => {
          const updates = updateMap.get(obj.id);
          if (!updates) return { ...obj, _opacity: 1 };

          // Interpolate only what changed
          return {
            ...obj,
            x: 'x' in updates ? obj.x + (updates.x - obj.x) * p : obj.x,
            y: 'y' in updates ? obj.y + (updates.y - obj.y) * p : obj.y,
            rotation: 'rotation' in updates ? (obj.rotation || 0) + ((updates.rotation || 0) - (obj.rotation || 0)) * p : (obj.rotation || 0),
            _opacity: 1
          };
        });
        set({ interpolatedObjects: interpolated });
      },
      onComplete: () => {
        // Finally apply the real changes to the store
        const projectStore = useProjectStore.getState();
        projectStore.updateObjects(batchUpdates);
        set({ isPlaying: false, interpolatedObjects: null });
      }
    });
  },

  stopSequence: () => {
    if (playbackTimeline) {
      playbackTimeline.kill();
      playbackTimeline = null;
    }
    set({ isPlaying: false, interpolatedObjects: null });
  }
}));
