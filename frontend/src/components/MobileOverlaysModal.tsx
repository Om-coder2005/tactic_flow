import React from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { AIPanel } from '@/features/ai/AIPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Layers, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileOverlaysModal: React.FC = () => {
  const isMobileOverlaysOpen = useEditorStore((s: any) => s.isMobileOverlaysOpen);
  const setMobileOverlaysOpen = useEditorStore((s: any) => s.setMobileOverlaysOpen);
  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);

  return (
    <AnimatePresence>
      {isMobileOverlaysOpen && (
        <div className="md:hidden fixed inset-0 z-[180] flex items-end justify-center p-3 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOverlaysOpen(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-auto"
          />

          {/* Floating Card Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-[360px] max-h-[50vh] bg-white border border-[#e2e4df] rounded-2xl shadow-2xl backdrop-blur-md p-3.5 pointer-events-auto overflow-y-auto scrollbar-hide text-[#1f2421] space-y-3 mb-14"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e4df]">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-[#15803d]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                  Tactical Overlays & AI
                </h3>
              </div>
              <button
                onClick={() => setMobileOverlaysOpen(false)}
                className="p-1 rounded-lg text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pitch Grid Toggle Row */}
            <div className="bg-[#f9faf8] p-2.5 rounded-xl border border-[#e2e4df] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-[#5c635e]" />
                <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider">
                  Pitch Grid
                </span>
              </div>
              <button
                onClick={toggleGrid}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border touch-manipulation",
                  gridEnabled 
                    ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]" 
                    : "bg-white text-[#5c635e] border-[#e2e4df]"
                )}
              >
                {gridEnabled ? 'Grid ON' : 'Grid OFF'}
              </button>
            </div>

            {/* Tactical Overlays Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#5c635e] tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#15803d]" /> Tactical Overlays
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['none', 'thirds', '18_zones', '5_vertical_lanes'] as const).map((opt) => {
                  const labels: Record<string, string> = {
                    none: 'None',
                    thirds: 'Thirds',
                    '18_zones': '18 Zones',
                    '5_vertical_lanes': '5 Lanes'
                  };
                  const isActive = pitchZoneOverlay === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setPitchZoneOverlay(isActive ? 'none' : opt)}
                      className={cn(
                        "py-2 px-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border text-center touch-manipulation min-h-[38px]",
                        isActive
                          ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0] font-bold"
                          : "bg-white text-[#5c635e] hover:text-[#1f2421] border-[#e2e4df]"
                      )}
                    >
                      {labels[opt]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Section */}
            <div className="pt-2 border-t border-[#e2e4df]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">AI Assistant</span>
              </div>
              <AIPanel />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
