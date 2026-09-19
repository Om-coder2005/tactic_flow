import React, { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { usePlayback } from './usePlayback';
import type { Frame, PhaseLabel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_COLORS: Record<NonNullable<PhaseLabel>, string> = {
  build_up: '#2563eb',
  mid_block: '#d97706',
  high_press: '#dc2626',
  rest_defence: '#7c3aed',
  final_third: '#059669',
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

  // Navigation handlers
  const activeIndex = frames.findIndex((f: any) => f.id === activeFrameId);
  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveFrame(frames[activeIndex - 1]!.id);
    }
  };
  const handleNext = () => {
    if (activeIndex >= 0 && activeIndex < frames.length - 1) {
      setActiveFrame(frames[activeIndex + 1]!.id);
    }
  };

  return (
    <footer className="h-13 sm:h-14 flex items-center bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl z-10 select-none overflow-hidden px-1.5 sm:px-2 gap-1.5 sm:gap-2 text-[#1f2421]">
      {/* Transport Playback Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 border-r border-[#e2e4df] h-full shrink-0">
        <button
          onClick={handlePrev}
          disabled={activeIndex <= 0}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors touch-manipulation"
          title="Previous Frame"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlayback}
          className={cn(
            "w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all shadow-sm touch-manipulation",
            isPlaying 
              ? "bg-amber-100 text-amber-700 border border-amber-300" 
              : "bg-[#15803d] hover:bg-[#166534] text-white"
          )}
          title={isPlaying ? "Pause Playback" : "Play Sequence"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={activeIndex < 0 || activeIndex >= frames.length - 1}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] disabled:opacity-30 disabled:hover:text-[#5c635e] transition-colors touch-manipulation"
          title="Next Frame"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Frame Strip */}
      <div className="flex-1 flex items-center gap-2 px-1 overflow-x-auto scrollbar-hide py-1">
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

        {/* Add Frame Button */}
        <button
          onClick={handleAdd}
          className="flex-shrink-0 h-10 px-3 rounded-xl border border-dashed border-[#c0c4ba] hover:border-[#15803d] bg-[#f9faf8] hover:bg-[#eef7f2] text-[#5c635e] hover:text-[#15803d] flex items-center gap-1.5 text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Frame</span>
        </button>
      </div>

      {/* Animation Stats */}
      <div className="hidden lg:flex items-center gap-3 px-3 border-l border-[#e2e4df] shrink-0 text-xs font-semibold text-[#5c635e]">
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#15803d]" />
          <span>{frames.length} {frames.length === 1 ? 'Frame' : 'Frames'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#707872]" />
          <span>{(frames.reduce((acc: number, f: any) => acc + (f.duration_ms || 1800), 0) / 1000).toFixed(1)}s Total</span>
        </div>
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
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 10 }}
        className={cn(
          "flex-shrink-0 h-10 px-3 rounded-xl border transition-all relative group cursor-pointer flex items-center gap-2.5 overflow-hidden select-none",
          isActive
            ? "border-[#15803d] bg-[#eef7f2] text-[#1f2421] shadow-sm"
            : "border-[#e2e4df] bg-[#f9faf8] hover:bg-[#f4f5f1] text-[#5c635e] hover:text-[#1f2421]"
        )}
        onClick={onSelect}
      >
        {/* Frame Index Indicator */}
        <span className={cn(
          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
          isActive ? "bg-[#15803d]/15 text-[#15803d]" : "bg-[#e2e4df] text-[#5c635e]"
        )}>
          #{index + 1}
        </span>

        {/* Phase Badge or Name */}
        <div className="flex items-center gap-1.5 max-w-[110px]">
          {frame.phase_label ? (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: PHASE_COLORS[frame.phase_label] }}
              title={PHASE_LABELS[frame.phase_label]}
            />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#949c95] shrink-0" />
          )}
          <span className="text-xs font-semibold truncate leading-none">
            {frame.name}
          </span>
        </div>

        {/* Meta Stats */}
        <span className="text-[9px] font-mono text-[#707872] uppercase tracking-tighter">
          {frame.duration_ms / 1000}s
        </span>

        {/* Hover Quick Actions overlay */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 pl-1">
          <button 
            className="p-1 rounded text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] transition-colors"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicate Frame"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button 
            className="p-1 rounded text-[#5c635e] hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete Frame"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }
);

FrameThumb.displayName = 'FrameThumb';


