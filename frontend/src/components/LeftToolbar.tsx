import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore, type ToolType } from '@/stores/editorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, 
  User, 
  ShieldCheck, 
  CircleDot, 
  Triangle, 
  MoveRight, 
  Spline, 
  ArrowRightLeft, 
  Pencil, 
  Square, 
  Grid3X3, 
  Type, 
  Eraser,
  Waypoints,
  ScanLine,
  Goal,
  PersonStanding,
  Footprints,
  MoreHorizontal,
  Info
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
    id: 'arrow', 
    label: 'Movement', 
    hint: 'Drag on pitch to create a run (START ● ──→ END)', 
    icon: MoveRight, 
    shortcut: 'A' 
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
    { id: 'curved_arrow', label: 'Curved Run', hint: 'Drag to create a curved run path', icon: Spline },
    { id: 'dashed_arrow', label: 'Dashed Run', hint: 'Drag to create a dashed run path', icon: ArrowRightLeft },
    { id: 'dashed_curved', label: 'Dashed Curved', hint: 'Drag to create dashed curved run', icon: Waypoints },
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeHint, setActiveHint] = useState<{ title: string; hint: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<any>(null);

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
      className="relative h-full flex items-center select-none"
    >
      {/* Floating Vertical Tool Dock */}
      <div className="w-12 h-full flex flex-col items-center py-2.5 bg-white border border-[#e2e4df] shadow-sm backdrop-blur-md rounded-2xl z-[100]">
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          {/* Primary Tools */}
          {PRIMARY_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => triggerTool(tool)}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all relative group",
                  isActive
                    ? "bg-[#eef7f2] text-[#15803d] border border-[#bbf7d0] shadow-sm"
                    : "text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1]"
                )}
                title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
              >
                <Icon className="w-4 h-4" />
                
                {/* Active Tool Left Accent Bar */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -left-1 w-1 h-4 bg-[#15803d] rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          {/* More Tools Popover Trigger */}
          <div className="relative w-full flex justify-center">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              onMouseEnter={() => setIsMoreOpen(true)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all relative group",
                isMoreActive || isMoreOpen
                  ? "bg-[#eef7f2] text-[#15803d] border border-[#bbf7d0] shadow-sm"
                  : "text-[#5c635e] hover:text-[#1f2421] hover:bg-[#f4f5f1]"
              )}
              title="More Tactical Elements"
            >
              <MoreHorizontal className="w-4 h-4" />
              
              {isMoreActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute -left-1 w-1 h-4 bg-[#15803d] rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#949c95] group-hover:bg-[#15803d]" />
            </button>

            {/* More Popover Drawer */}
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onMouseLeave={() => setIsMoreOpen(false)}
                  className="absolute left-full top-0 ml-2 py-2 px-1.5 bg-white border border-[#e2e4df] rounded-xl shadow-xl backdrop-blur-md flex flex-col gap-1 min-w-[170px] z-50 text-[#1f2421]"
                >
                  <span className="text-[9px] font-bold text-[#707872] uppercase tracking-wider px-2 py-0.5 border-b border-[#e2e4df] mb-0.5">
                    {MORE_TOOLS.name}
                  </span>
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
                          "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full text-left",
                          isSubActive
                            ? "bg-[#eef7f2] text-[#15803d] border border-[#bbf7d0]"
                            : "text-[#374151] hover:text-[#111827] hover:bg-[#f4f5f1]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{subItem.label}</span>
                        </div>
                        {subItem.shortcut && (
                          <span className="text-[9px] font-mono text-[#5c635e] bg-[#f4f5f1] border border-[#e2e4df] px-1 py-0.5 rounded">
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
      </div>

      {/* Floating Contextual Tool Hint */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, x: -10, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -10, y: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute left-full top-2 ml-3.5 px-3 py-2 bg-[#1f2421] text-white rounded-xl shadow-lg border border-neutral-700 z-[110] flex items-center gap-2 text-xs whitespace-nowrap pointer-events-none"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                {activeHint.title}:
              </span>
              <span className="font-medium text-[11px] text-neutral-200">
                {activeHint.hint}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



