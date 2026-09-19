import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Grid3X3, 
  ChevronDown, 
  Layers, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIPanel } from '@/features/ai/AIPanel';

export const OverlaysDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const gridEnabled = useEditorStore((s: any) => s.gridEnabled);
  const toggleGrid = useEditorStore((s: any) => s.toggleGrid);
  const pitchZoneOverlay = useEditorStore((s: any) => s.pitchZoneOverlay);
  const setPitchZoneOverlay = useEditorStore((s: any) => s.setPitchZoneOverlay);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={cn(
          "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm",
          isOpen 
            ? "bg-[#55AA55] text-white border-[#55AA55]" 
            : "bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] border-[#333a34]"
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Tactical Overlays & Grid"
      >
        <Grid3X3 className="w-3.5 h-3.5 text-[#55AA55]" />
        <span>Overlays</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[320px] z-[220] pointer-events-none"
          >
            <Card className="pointer-events-auto bg-white border border-[#e2e4df] shadow-xl overflow-hidden rounded-2xl text-[#1f2421]">
              <CardHeader className="bg-[#f9faf8] p-3 flex-row items-center justify-between space-y-0 border-b border-[#e2e4df]">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-[#15803d]" />
                  <CardTitle className="text-[#1f2421] text-xs uppercase tracking-wider font-bold">
                    Tactical Overlays & AI
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-3 space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide bg-white">
                {/* Pitch Grid Row */}
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
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border",
                      gridEnabled 
                        ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0]" 
                        : "bg-white text-[#5c635e] border-[#e2e4df]"
                    )}
                  >
                    {gridEnabled ? 'Grid ON' : 'Grid OFF'}
                  </button>
                </div>

                {/* Overlays Options Grid */}
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
                            "py-2 px-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border text-center min-h-[38px] flex items-center justify-center gap-1",
                            isActive
                              ? "bg-[#eef7f2] text-[#15803d] border-[#bbf7d0] font-bold"
                              : "bg-white text-[#5c635e] hover:text-[#1f2421] border-[#e2e4df]"
                          )}
                        >
                          <span>{labels[opt]}</span>
                          {isActive && <Check className="w-3 h-3 text-[#15803d]" />}
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
