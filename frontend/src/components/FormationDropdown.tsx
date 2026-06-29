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
  Target,
  ShieldAlert
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

    setPreviewFormation(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className={cn(
          "h-10 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#121212]",
          isOpen ? "bg-[#35d7ff] text-black" : "bg-white dark:bg-surface-800 text-surface-700 dark:text-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Users className="w-4 h-4 mr-2" />
        Formations
        <ChevronDown className={cn("w-3 h-3 ml-2 transition-transform", isOpen && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-3 left-0 w-[360px] z-[220] pointer-events-none"
          >
            <Card className="pointer-events-auto bg-[#fffdf7] dark:bg-surface-900 border-[3px] border-black dark:border-surface-500 shadow-[6px_6px_0_#121212] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)] overflow-hidden rounded-2xl">
               <CardHeader className="bg-[#ffd400] p-4 flex-row items-center justify-between space-y-0 border-b-[3px] border-black">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-black" />
                    <CardTitle className="text-black text-xs uppercase tracking-widest font-black">Tactical Library</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[9px] font-black uppercase text-black dark:text-white border border-black dark:border-surface-500 bg-white dark:bg-surface-800 hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black"
                    onClick={() => {}} // Save current logic would go here
                  >
                    <Plus className="w-3 h-3 mr-1" /> Save Draft
                  </Button>
               </CardHeader>

               <CardContent className="p-0 max-h-[480px] overflow-y-auto scrollbar-hide pb-4 bg-[#fffdf7] dark:bg-surface-900">
                  {Object.entries(allGroups).map(([group, formations]) => (
                    <div key={group} className="mt-4 px-4">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">{group}</span>
                         <Separator className="flex-1 opacity-70 bg-black dark:bg-surface-700" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                         {formations.map((fmt: any) => (
                           <div 
                             key={fmt.id} 
                             className="group relative bg-white dark:bg-surface-800 rounded-xl p-3 border-2 border-black dark:border-surface-500 shadow-[3px_3px_0_#121212] dark:shadow-[3px_3px_0_rgba(255,255,255,0.15)] hover:bg-[#ffe98a] dark:hover:bg-[#ffe98a] hover:text-black dark:hover:text-black transition-all cursor-crosshair"
                             onClick={() => {
                               setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'home' });
                               setIsOpen(false);
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
                                   <h4 className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-tight">{fmt.name}</h4>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-bold text-surface-400 uppercase">{fmt.format}</span>
                                      <div className="w-1 h-1 rounded-full bg-surface-300" />
                                      <span className="text-[9px] font-bold text-surface-400 uppercase">{fmt.nodes.length} Players</span>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all pl-2">
                                    <Button 
                                      variant="default" 
                                      className="h-7 px-2.5 flex-shrink-0 rounded-lg text-[9px] font-black uppercase bg-team-home text-white border border-black shadow-[2px_2px_0_#121212] hover:bg-team-home/90 transition-all"
                                      onClick={(e) => { e.stopPropagation(); applyFormation(fmt, 'home'); }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'home' });
                                      }}
                                    >
                                      Home
                                    </Button>
                                    <Button 
                                      variant="default" 
                                      className="h-7 px-2.5 flex-shrink-0 rounded-lg text-[9px] font-black uppercase bg-team-away text-white border border-black shadow-[2px_2px_0_#121212] hover:bg-team-away/90 transition-all"
                                      onClick={(e) => { e.stopPropagation(); applyFormation(fmt, 'away'); }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'away' });
                                      }}
                                      onMouseLeave={(e) => {
                                        e.stopPropagation();
                                        setPreviewFormation({ templateId: fmt.id, nodes: fmt.nodes, team: 'home' });
                                      }}
                                    >
                                      Away
                                    </Button>
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
