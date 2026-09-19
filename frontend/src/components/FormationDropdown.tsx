import React, { useState, useRef, useEffect } from 'react';
import { PREBUILT_FORMATIONS, type FormationTemplateDef } from '@/features/formations/prebuiltFormations';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { createPlayer, createGoalkeeper } from '@/features/objects/objectFactories';
import { tacticService } from '@/services/tacticService';
import { useAuthStore } from '@/stores/authStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  ChevronDown, 
  Plus, 
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUPED_FORMATIONS = {
  '11v11': PREBUILT_FORMATIONS.filter((f) => f.format === '11v11'),
  'Small Sided': PREBUILT_FORMATIONS.filter((f) => f.format !== '11v11'),
};

export const FormationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customFormations, setCustomFormations] = useState<any[]>([]);

  const pushHistory = useEditorStore((s: any) => s.pushHistory);
  const setPreviewFormation = useEditorStore((s: any) => s.setPreviewFormation);
  const projectStore = useProjectStore.getState();
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      tacticService.getFormations().then((res) => {
        if (Array.isArray(res)) {
          setCustomFormations(res.filter((f) => !f.is_builtin));
        }
      }).catch(console.error);
    }
  }, [isOpen, isAuthenticated]);

  const allGroups = {
    ...GROUPED_FORMATIONS,
    ...(customFormations.length > 0 ? { 'Custom Templates': customFormations } : {})
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setPreviewFormation(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const applyFormation = (template: FormationTemplateDef, team: 'home' | 'away') => {
    const activeSnapshot = projectStore.getActiveSnapshot();
    if (!activeSnapshot) return;

    pushHistory(structuredClone(activeSnapshot));

    const isAway = team === 'away';
    const existingPlayers = activeSnapshot.objects.filter(o => 
      (o as any).team === team && (o.type === 'player' || o.type === 'goalkeeper')
    );

    if (existingPlayers.length > 0) {
      const updates: { id: string; updates: any }[] = [];
      const nodes = [...template.nodes];
      
      const gkNode = nodes.find(n => n.role === 'GK');
      const otherNodes = nodes.filter(n => n.role !== 'GK');
      const gkPlayer = existingPlayers.find(p => p.type === 'goalkeeper');
      const otherPlayers = existingPlayers.filter(p => p.type !== 'goalkeeper');

      if (gkPlayer && gkNode) {
        updates.push({
          id: gkPlayer.id,
          updates: { x: isAway ? 100 - gkNode.x : gkNode.x, y: gkNode.y }
        });
      }

      otherPlayers.sort((a, b) => a.y - b.y || a.x - b.x);
      otherNodes.sort((a, b) => a.y - b.y || a.x - b.x);

      otherPlayers.forEach((p, i) => {
        const node = otherNodes[i];
        if (node) {
          updates.push({
            id: p.id,
            updates: { x: isAway ? 100 - node.x : node.x, y: node.y, label: node.role }
          });
        }
      });

      usePlaybackStore.getState().animateObjectUpdates(updates);
      
      if (existingPlayers.length < template.nodes.length) {
         const remainingNodes = template.nodes.slice(existingPlayers.length);
         remainingNodes.forEach(node => {
            const finalX = isAway ? 100 - node.x : node.x;
            const obj = node.role === 'GK' ? createGoalkeeper(finalX, node.y, team) : createPlayer(finalX, node.y, team);
            if (node.role !== 'GK') obj.label = node.role;
            projectStore.addObject(obj);
         });
      }
    } else {
      template.nodes.forEach((node) => {
        const finalX = isAway ? 100 - node.x : node.x;
        const obj = node.role === 'GK' ? createGoalkeeper(finalX, node.y, team) : createPlayer(finalX, node.y, team);
        if (node.role !== 'GK') obj.label = node.role;
        projectStore.addObject(obj);
      });
    }

    closeDropdown();
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseLeave={() => {
        if (isOpen) setPreviewFormation(null);
      }}
    >
      <button
        className={cn(
          "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm",
          isOpen 
            ? "bg-[#55AA55] text-white border-[#55AA55]" 
            : "bg-[#242A25] hover:bg-[#2e3630] text-[#E8ECE9] border-[#333a34]"
        )}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Formations</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 w-[340px] z-[220] pointer-events-none"
          >
            <Card className="pointer-events-auto bg-white border border-[#e2e4df] shadow-xl overflow-hidden rounded-2xl text-[#1f2421]">
               <CardHeader className="bg-[#f9faf8] p-3 flex-row items-center justify-between space-y-0 border-b border-[#e2e4df]">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#15803d]" />
                    <CardTitle className="text-[#1f2421] text-xs uppercase tracking-wider font-bold">Tactical Library</CardTitle>
                  </div>
               </CardHeader>

               <CardContent className="p-0 max-h-[420px] overflow-y-auto scrollbar-hide pb-3 bg-white">
                  {Object.entries(allGroups).map(([group, formations]) => (
                    <div key={group} className="mt-3 px-3">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e]">{group}</span>
                         <Separator className="flex-1 opacity-40 bg-[#e2e4df]" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                         {formations.map((fmt: any) => (
                           <div 
                             key={fmt.id} 
                             className="group relative bg-[#f9faf8] rounded-xl p-2.5 border border-[#e2e4df] hover:bg-[#f4f5f1] transition-all cursor-pointer"
                             onClick={() => {
                               applyFormation(fmt, 'home');
                             }}
                             onMouseEnter={() => {
                               if (isOpen) {
                                 setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'home' });
                               }
                             }}
                             onMouseLeave={() => {
                               if (isOpen) {
                                 setPreviewFormation(null);
                               }
                             }}
                           >
                              <div className="flex items-center justify-between">
                                 <div>
                                   <h4 className="text-xs font-bold text-[#1f2421] uppercase tracking-tight">{fmt.name}</h4>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-semibold text-[#5c635e] uppercase">{fmt.format}</span>
                                      <div className="w-1 h-1 rounded-full bg-[#d0d3c9]" />
                                      <span className="text-[9px] font-semibold text-[#5c635e] uppercase">{fmt.nodes.length} Players</span>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all pl-2">
                                    <button 
                                      className="h-6 px-2 rounded text-[9px] font-bold uppercase bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        applyFormation(fmt, 'home'); 
                                      }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'home' });
                                      }}
                                    >
                                      Home
                                    </button>
                                    <button 
                                      className="h-6 px-2 rounded text-[9px] font-bold uppercase bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm"
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        applyFormation(fmt, 'away'); 
                                      }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'away' });
                                      }}
                                    >
                                      Away
                                    </button>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

