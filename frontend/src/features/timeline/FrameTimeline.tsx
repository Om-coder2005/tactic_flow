import React, { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { usePlayback } from './usePlayback';
import type { Frame, PhaseLabel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_COLORS: Record<NonNullable<PhaseLabel>, string> = {
  build_up: '#3b82f6',
  mid_block: '#eab308', // mustard
  high_press: '#ef4444',
  rest_defence: '#8b5cf6',
  final_third: '#10b981',
};

const PHASE_LABELS: Record<NonNullable<PhaseLabel>, string> = {
  build_up: 'Build-up',
  mid_block: 'Mid-block',
  high_press: 'High Press',
  rest_defence: 'Rest Defence',
  final_third: 'Final Third',
};

export const FrameTimeline: React.FC = () => {
  const frames = useProjectStore((s: any) => s.frames);
  const activeFrameId = useProjectStore((s: any) => s.activeFrameId);
  const setActiveFrame = useProjectStore((s: any) => s.setActiveFrame);
  const addFrame = useProjectStore((s: any) => s.addFrame);
  const deleteFrame = useProjectStore((s: any) => s.deleteFrame);
  const duplicateFrame = useProjectStore((s: any) => s.duplicateFrame);

  const handleAdd = useCallback(() => {
    addFrame(activeFrameId ?? undefined);
  }, [addFrame, activeFrameId]);

  const { togglePlayback, isPlaying } = usePlayback();

  return (
    <footer className="h-timeline flex items-center bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 rounded-2xl z-10 select-none shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)] overflow-hidden">
      {/* Playback Section */}
      <div className="flex flex-col items-center gap-1 px-4 border-r-2 border-black dark:border-surface-500 h-full justify-center bg-[#fff] dark:bg-surface-800">
        <Button
          variant="retro"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </Button>
        <span className="text-[10px] font-black uppercase tracking-tighter text-surface-400">
          {isPlaying ? 'Sync' : 'Analysis'}
        </span>
      </div>

      {/* Frame Strip */}
      <div className="flex-1 flex items-center gap-2.5 px-4 overflow-x-auto scrollbar-hide py-2">
        <AnimatePresence initial={false}>
          {frames.map((frame: any, idx: number) => (
            <FrameThumb
              key={frame.id}
              frame={frame}
              index={idx}
              isActive={frame.id === activeFrameId}
              onSelect={() => setActiveFrame(frame.id)}
              onDuplicate={() => duplicateFrame(frame.id)}
              onDelete={() => deleteFrame(frame.id)}
            />
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          className="flex-shrink-0 w-24 h-18 rounded-2xl border-2 border-dashed border-black/35 flex flex-col items-center justify-center gap-1 hover:border-black hover:bg-[#ffe98a] group transition-all"
          onClick={handleAdd}
        >
          <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-retro-mustard group-hover:text-retro-ink transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-surface-400 group-hover:text-retro-ink">Add Frame</span>
        </Button>
      </div>

      {/* Global Stats */}
      <div className="hidden md:flex flex-col items-end px-5 text-right gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black font-mono text-retro-ink dark:text-white leading-none">
            {String(frames.length).padStart(2, '0')}
          </span>
          <Layers className="w-4 h-4 text-retro-mustard" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-surface-400">Total Frames</span>
      </div>
    </footer>
  );
};

interface FrameThumbProps {
  frame: Frame;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const FrameThumb: React.FC<FrameThumbProps> = React.memo(
  ({ frame, index, isActive, onSelect, onDuplicate, onDelete }) => {
    const objectCount = frame.snapshot.objects.length;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: 20 }}
        className={cn(
          "flex-shrink-0 w-36 h-[88px] rounded-2xl border-2 transition-all duration-300 relative group cursor-pointer overflow-hidden",
          isActive
            ? "border-black bg-[#ffe98a] shadow-[4px_4px_0_#121212] dark:shadow-[4px_4px_0_rgba(255,255,255,0.3)] -translate-y-1 z-10"
            : "border-black/20 bg-white dark:bg-surface-800 dark:border-surface-600 hover:border-black dark:hover:border-white shadow-[2px_2px_0_rgba(18,18,18,0.1)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_0_#121212] dark:hover:shadow-[4px_4px_0_rgba(255,255,255,0.3)] hover:-translate-y-1"
        )}
        onClick={onSelect}
      >
        {/* Massive Background Index Overlay */}
        <div className={cn(
          "absolute -right-2 -bottom-4 text-[72px] font-black font-mono leading-none select-none z-0 pointer-events-none transition-opacity",
          isActive ? "text-black opacity-10" : "text-black dark:text-white opacity-5 group-hover:opacity-10"
        )}>
          {index + 1}
        </div>

        {/* Content */}
        <div className="p-3 h-full flex flex-col justify-between relative z-10">
          <div className="flex items-start justify-between">
            {frame.phase_label ? (
              <div
                className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter text-white shadow-sm border border-black/20"
                style={{ backgroundColor: PHASE_COLORS[frame.phase_label] }}
              >
                {PHASE_LABELS[frame.phase_label]}
              </div>
            ) : (
              <div className={cn(
                "w-2 h-2 rounded-full border",
                isActive ? "bg-black border-black/20" : "bg-surface-300 dark:bg-surface-600 border-transparent"
              )} />
            )}
          </div>

          <div>
            <h4 className={cn(
              "text-[12px] font-black truncate leading-tight",
              isActive ? "text-black" : "text-surface-700 dark:text-white"
            )}>
              {frame.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                isActive ? "text-black/60" : "text-surface-500"
              )}>{objectCount} OBJ</span>
              <div className={cn(
                "h-1 w-1 rounded-full",
                isActive ? "bg-black/40" : "bg-surface-300 dark:bg-surface-600"
              )} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                isActive ? "text-black/60" : "text-surface-500"
              )}>{frame.duration_ms / 1000}S</span>
            </div>
          </div>
        </div>

        {/* Hover Actions HUD - Frosted glass logic */}
        <div className={cn(
          "absolute inset-0 rounded-xl backdrop-blur-[4px] flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-20",
          isActive ? "bg-[#ffe98a]/70" : "bg-white/60 dark:bg-surface-900/60"
        )}>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-xl bg-white dark:bg-surface-800 border-2 border-black dark:border-white text-black dark:text-white hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-xl bg-white dark:bg-surface-800 border-2 border-black dark:border-white text-black dark:text-white hover:bg-retro-burgundy hover:text-white shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }
);

FrameThumb.displayName = 'FrameThumb';
