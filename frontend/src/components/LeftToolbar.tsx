import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore, type ToolType } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { AIPanel } from '@/features/ai/AIPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, 
  User, 
  ShieldCheck, 
  CircleDot, 
  Triangle, 
  Pencil, 
  Square, 
  Grid3X3, 
  Type, 
  Eraser,
  ScanLine,
  Goal,
  PersonStanding,
  MoreHorizontal,
  Info,
  Undo2,
  Redo2,
  Sparkles,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolItem {
  id: ToolType;
  label: string;
  hint: string;
  icon: React.ElementType;
  shortcut?: string;
}

interface ToolGroup {
  id: string;
  name: string;
  items: ToolItem[];
}

const PRIMARY_TOOLS: ToolItem[] = [
  { 
    id: 'select', 
    label: 'Select', 
    hint: 'Click or drag box to select and move objects', 
    icon: MousePointer2, 
    shortcut: 'V' 
  },
  { 
    id: 'player', 
    label: 'Player', 
    hint: 'Click pitch to place a field player', 
    icon: User, 
    shortcut: 'P' 
  },
  { 
    id: 'pencil', 
    label: 'Draw', 
    hint: 'Click & drag to draw freehand tactical lines', 
    icon: Pencil, 
    shortcut: 'L' 
  },
  { 
    id: 'zone', 
    label: 'Zone', 
    hint: 'Drag across pitch to create a tactical area zone', 
    icon: Grid3X3, 
    shortcut: 'Z' 
  },
  { 
    id: 'text', 
    label: 'Text', 
    hint: 'Click pitch to add a tactical note', 
    icon: Type, 
    shortcut: 'T' 
  },
];

const MORE_TOOLS: ToolGroup = {
  id: 'more',
  name: 'More Elements & Tools',
  items: [
    { id: 'goalkeeper', label: 'Goalkeeper', hint: 'Click pitch to place a goalkeeper', icon: ShieldCheck, shortcut: 'G' },
    { id: 'ball', label: 'Football', hint: 'Click pitch to place ball', icon: CircleDot, shortcut: 'B' },
    { id: 'shape', label: 'Shape', hint: 'Drag to draw shape', icon: Square },
    { id: 'cone', label: 'Cone', hint: 'Click pitch to place training cone', icon: Triangle },
    { id: 'ladder', label: 'Agility Ladder', hint: 'Click pitch to place ladder', icon: ScanLine },
    { id: 'mini_goal', label: 'Mini Goal', hint: 'Click pitch to place mini goal', icon: Goal },
    { id: 'mannequin', label: 'Mannequin', hint: 'Click pitch to place free-kick mannequin', icon: PersonStanding },
    { id: 'eraser', label: 'Eraser', hint: 'Click or drag over elements to erase', icon: Eraser, shortcut: 'E' }
  ]
};

export const LeftToolbar: React.FC = () => {
  const activeTool = useEditorStore((s: any) => s.activeTool);
  const setTool = useEditorStore((s: any) => s.setTool);
  const undo = useEditorStore((s: any) => s.undo);
  const redo = useEditorStore((s: any) => s.redo);
  const historyIndex = useEditorStore((s: any) => s.historyIndex);
  const historyLength = useEditorStore((s: any) => s.history.length);
  const isMobileOverlaysOpen = useEditorStore((s: any) => s.isMobileOverlaysOpen);
  const toggleMobileOverlays = useEditorStore((s: any) => s.toggleMobileOverlays);

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeHint, setActiveHint] = useState<{ title: string; hint: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<any>(null);

  const handleUndo = useCallback(() => {
    const snapshot = undo();
    if (snapshot) {
      useProjectStore.getState().updateActiveSnapshot(snapshot);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const snapshot = redo();
    if (snapshot) {
      useProjectStore.getState().updateActiveSnapshot(snapshot);
    }
  }, [redo]);

  const triggerTool = (item: ToolItem) => {
    setTool(item.id);
    setIsMoreOpen(false);

    // Show floating contextual hint
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setActiveHint({ title: item.label, hint: item.hint });
    hintTimeoutRef.current = setTimeout(() => {
      setActiveHint(null);
    }, 3200);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = MORE_TOOLS.items.some(i => i.id === activeTool);

  return (
    <div 
      ref={containerRef}
      className="relative md:h-full w-full flex items-center justify-center select-none"
    >

      {/* Floating Tool Dock (Horizontal on Mobile <768px, Vertical on Desktop >=768px) */}
      <div className="w-full md:w-12 h-auto md:h-full flex flex-row md:flex-col items-center justify-between md:justify-start px-1.5 sm:px-2 py-1.5 md:py-2.5 md:px-0 bg-white border border-[#D0D8D2] shadow-sm backdrop-blur-md rounded-2xl z-[100] md:overflow-visible">
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-1 md:gap-1.5 w-full shrink-0">
          {/* Mobile Undo / Redo Controls */}
          <div className="md:hidden flex items-center gap-0.5 border-r border-[#D0D8D2] pr-1.5 shrink-0">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8A918B] hover:text-[#161A17] hover:bg-[#E8ECE9] disabled:opacity-30 disabled:hover:text-[#8A918B] transition-colors touch-manipulation"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= historyLength - 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8A918B] hover:text-[#161A17] hover:bg-[#E8ECE9] disabled:opacity-30 disabled:hover:text-[#8A918B] transition-colors touch-manipulation"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Tools */}
          <div className="flex flex-row md:flex-col items-center gap-1 md:gap-1.5 shrink-0">
            {PRIMARY_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;

              return (
                <button
                  key={tool.id}
                  onClick={() => { triggerTool(tool); }}
                  className={cn(
                    "min-w-[38px] min-h-[38px] w-9 h-9 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all relative group touch-manipulation",
                    isActive
                      ? "bg-[#EBF5EB] text-[#55AA55] border border-[#55AA55]/40 shadow-sm font-bold"
                      : "text-[#8A918B] hover:text-[#161A17] hover:bg-[#E8ECE9]"
                  )}
                  title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  
                  {/* Active Tool Accent Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -bottom-1 md:bottom-auto md:-left-1 h-1 md:h-4 w-4 md:w-1 bg-[#55AA55] rounded-t-full md:rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* More Tools Popover Trigger (...) */}
            <div className="relative flex justify-center">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    useEditorStore.getState().toggleMobileTools();
                  } else {
                    setIsMoreOpen(!isMoreOpen);
                  }
                }}
                className={cn(
                  "min-w-[38px] min-h-[38px] w-9 h-9 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all relative group touch-manipulation",
                  isMoreActive || isMoreOpen || useEditorStore.getState().isMobileToolsOpen
                    ? "bg-[#EBF5EB] text-[#55AA55] border border-[#55AA55]/40 shadow-sm font-bold"
                    : "text-[#8A918B] hover:text-[#161A17] hover:bg-[#E8ECE9]"
                )}
                title="More Tactical Elements (...)"
              >
                <MoreHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                
                {isMoreActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -bottom-1 md:bottom-auto md:-left-1 h-1 md:h-4 w-4 md:w-1 bg-[#55AA55] rounded-t-full md:rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#8A918B] group-hover:bg-[#55AA55]" />
              </button>

              {/* More Popover Drawer */}
              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full md:bottom-auto md:left-full md:top-0 mb-2 md:mb-0 md:ml-2 right-0 md:right-auto py-2 px-1.5 bg-white border border-[#D0D8D2] rounded-xl shadow-xl backdrop-blur-md flex flex-col gap-1 min-w-[180px] z-[160] text-[#161A17]"
                  >
                    <div className="flex items-center justify-between px-2 py-0.5 border-b border-[#D0D8D2] mb-0.5">
                      <span className="text-[9px] font-bold text-[#8A918B] uppercase tracking-wider">
                        {MORE_TOOLS.name}
                      </span>
                    </div>
                    {MORE_TOOLS.items.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTool === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerTool(subItem);
                          }}
                          className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs font-semibold transition-colors w-full text-left touch-manipulation min-h-[40px] md:min-h-0",
                            isSubActive
                              ? "bg-[#EBF5EB] text-[#55AA55] border border-[#55AA55]/40"
                              : "text-[#161A17] hover:text-[#55AA55] hover:bg-[#E8ECE9]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <SubIcon className="w-4 h-4 md:w-3.5 md:h-3.5" />
                            <span>{subItem.label}</span>
                          </div>
                          {subItem.shortcut && (
                            <span className="text-[9px] font-mono text-[#8A918B] bg-[#E8ECE9] border border-[#D0D8D2] px-1 py-0.5 rounded">
                              {subItem.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Mobile OVERLAYS Button */}
          <button
            onClick={toggleMobileOverlays}
            className={cn(
              "md:hidden min-h-[38px] px-2 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all touch-manipulation shrink-0 ml-1",
              isMobileOverlaysOpen
                ? "bg-[#EBF5EB] text-[#55AA55] border-[#55AA55]/40 shadow-sm font-extrabold"
                : "bg-[#E8ECE9] text-[#8A918B] hover:text-[#161A17] border-[#D0D8D2]"
            )}
            title="Overlays & Grid Settings"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-[#55AA55]" />
            <span>OVERLAYS</span>
          </button>
        </div>
      </div>

      {/* Floating Contextual Tool Hint */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full md:bottom-auto md:left-full md:top-2 mb-2 md:mb-0 md:ml-3.5 px-3 py-2 bg-[#1f2421] text-white rounded-xl shadow-lg border border-neutral-700 z-[170] flex items-center gap-2 text-xs whitespace-nowrap pointer-events-none max-w-[90vw] truncate"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                {activeHint.title}:
              </span>
              <span className="font-medium text-[11px] text-neutral-200 truncate">
                {activeHint.hint}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



