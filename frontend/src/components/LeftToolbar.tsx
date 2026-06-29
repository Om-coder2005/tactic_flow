import React, { useCallback } from 'react';
import { useEditorStore, type ToolType } from '@/stores/editorStore';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  UserCheck,
  Trophy,
  Activity,
  UserCog,
  Waypoints,
  ScanLine,
  Goal,
  PersonStanding
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolDef {
  id: ToolType;
  label: string;
  icon: React.ElementType;
  group: 'primary' | 'objects' | 'draw' | 'utility';
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select (V)', icon: MousePointer2, group: 'primary' },
  { id: 'player', label: 'Player (P)', icon: User, group: 'objects' },
  { id: 'goalkeeper', label: 'Goalkeeper (G)', icon: ShieldCheck, group: 'objects' },
  { id: 'ball', label: 'Ball (B)', icon: CircleDot, group: 'objects' },
  { id: 'cone', label: 'Cone', icon: Triangle, group: 'objects' },
  { id: 'ladder', label: 'Ladder', icon: ScanLine, group: 'objects' },
  { id: 'mini_goal', label: 'Mini Goal', icon: Goal, group: 'objects' },
  { id: 'mannequin', label: 'Mannequin', icon: PersonStanding, group: 'objects' },
  { id: 'arrow', label: 'Arrow (A)', icon: MoveRight, group: 'draw' },
  { id: 'curved_arrow', label: 'Curved Arrow', icon: Spline, group: 'draw' },
  { id: 'dashed_arrow', label: 'Dashed Arrow', icon: ArrowRightLeft, group: 'draw' },
  { id: 'dashed_curved', label: 'Dashed Curved', icon: Waypoints, group: 'draw' },
  { id: 'pencil', label: 'Pencil (L)', icon: Pencil, group: 'draw' },
  { id: 'shape', label: 'Shape', icon: Square, group: 'draw' },
  { id: 'zone', label: 'Zone', icon: Grid3X3, group: 'draw' },
  { id: 'text', label: 'Text (T)', icon: Type, group: 'draw' },
  { id: 'eraser', label: 'Eraser (E)', icon: Eraser, group: 'utility' },
];

export const LeftToolbar: React.FC = () => {
  const activeTool = useEditorStore((s: any) => s.activeTool);
  const setTool = useEditorStore((s: any) => s.setTool);
  const userMode = useEditorStore((s: any) => s.userMode);

  const handleClick = useCallback(
    (tool: ToolType) => {
      setTool(tool);
    },
    [setTool]
  );

  let currentGroup: string = '';

  const visibleTools = TOOLS;

  return (
    <div className="w-toolbar h-full flex flex-col items-center py-4 bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)] rounded-2xl z-[100]">
      <div className="flex flex-col items-center gap-1 w-full px-2 overflow-y-auto scrollbar-hide">
        {visibleTools.map((tool) => {
          const showDivider = tool.group !== currentGroup && currentGroup !== '';
          currentGroup = tool.group;
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <React.Fragment key={tool.id}>
              {showDivider && (
                <div className="px-3 py-2">
                  <Separator className="opacity-50" />
                </div>
              )}
              <div className="relative group px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title={tool.label}
                  className={cn(
                    "w-11 h-11 rounded-xl transition-colors relative z-10",
                    isActive
                      ? "bg-[#35d7ff] text-black border-2 border-black dark:border-white shadow-[2px_2px_0_#121212] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)]"
                      : "text-surface-600 dark:text-surface-300 hover:bg-[#ffe98a] hover:text-black"
                  )}
                  onClick={() => handleClick(tool.id)}
                >
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                </Button>
                
                {isActive && (
                  <motion.div 
                    layoutId="toolbar-active"
                    className="absolute inset-0 bg-retro-mustard/10 rounded-xl z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="mt-auto px-2 w-full flex flex-col items-center gap-4">
         <Separator className="opacity-50 w-8" />
         
         <div className="relative group">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-material-1",
              userMode === 'analyst' ? "bg-retro-burgundy text-white" : 
              userMode === 'coach' ? "bg-retro-mustard text-retro-ink" : 
              "bg-retro-ink text-retro-mustard"
            )}>
               {userMode === 'coach' ? <Trophy className="w-5 h-5" /> : 
                userMode === 'analyst' ? <Activity className="w-5 h-5" /> : 
                <UserCog className="w-5 h-5" />}
            </div>
            
            {/* Mode Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-surface-900 text-white text-[9px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-material-2">
               Mode: {userMode}
            </div>
         </div>
      </div>
    </div>
  );
};
