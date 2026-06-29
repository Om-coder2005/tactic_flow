import React from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Target,
  X
} from 'lucide-react';

export const PresentationControls: React.FC = () => {
  const spotlightEnabled = useEditorStore((s: any) => s.spotlightEnabled);
  const toggleSpotlight = useEditorStore((s: any) => s.toggleSpotlight);
  const togglePresentationMode = useEditorStore((s: any) => s.togglePresentationMode);
  
  const project = useProjectStore();
  const currentIndex = project.frames.findIndex((f) => f.id === project.activeFrameId);
  const totalFrames = project.frames.length;

  const handleNext = () => {
    const nextFrame = project.frames[currentIndex + 1];
    if (nextFrame) {
      project.setActiveFrame(nextFrame.id);
    }
  };

  const handlePrev = () => {
    const prevFrame = project.frames[currentIndex - 1];
    if (prevFrame) {
      project.setActiveFrame(prevFrame.id);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center bg-surface-800 rounded-xl px-3 py-1.5 mr-2">
        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mr-3">
          Sequence
        </span>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-surface-700"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <div className="text-xs font-mono text-white min-w-[40px] text-center">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-surface-500">/</span> {String(totalFrames).padStart(2, '0')}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-surface-700"
            onClick={handleNext}
            disabled={currentIndex === totalFrames - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="h-6 w-px bg-surface-700 mx-1" />

      <Button 
        variant={spotlightEnabled ? "secondary" : "ghost"} 
        size="sm" 
        className={spotlightEnabled ? "" : "text-white hover:bg-surface-700"}
        onClick={toggleSpotlight}
      >
        <Target className="w-4 h-4 mr-2" />
        Spotlight
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        className="text-white hover:bg-surface-700"
        onClick={togglePresentationMode}
      >
        <X className="w-4 h-4 mr-2" />
        Exit
      </Button>
    </div>
  );
};
