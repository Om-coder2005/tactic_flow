import React, { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { aiService } from '@/services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCcw,
  ShieldAlert,
  MessageSquareQuote,
  Zap,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AIPanel: React.FC = () => {
  const currentProject = useProjectStore(s => s.currentProject);
  const activeFrameId = useProjectStore(s => s.activeFrameId);
  const activeSnapshot = useProjectStore(s => s.getActiveSnapshot());
  const userMode = useEditorStore((s: any) => s.userMode);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [scope, setScope] = useState<'frame' | 'sequence'>('frame');

  const fetchInsights = async () => {
    if (!activeSnapshot || !activeFrameId) return;
    setLoading(true);
    setError(null);
    try {
      const projectId = currentProject?.id || 'local-draft';
      let result;
      
      // Determine the AI mode mapping
      const modeMapping: Record<string, string> = {
        'analyst': 'analytical',
        'coach': 'coach',
        'creator': 'creator'
      };
      const apiMode = modeMapping[userMode] || 'analytical';
      
      const frames = useProjectStore.getState().frames;

      if (scope === 'sequence' && frames.length > 0) {
         const snapshots = frames.map((f: any) => f.snapshot);
         result = await aiService.getSequenceSummary(projectId, snapshots, apiMode);
      } else {
         result = await aiService.getTacticalSummary(projectId, activeFrameId, activeSnapshot, apiMode);
      }
      
      setAiResult(result);
    } catch (e: any) {
        console.error(e);
        setError("Failed to generate insights. Ensure the Backend is running!");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {!aiResult ? (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-3"
          >
            {/* Scope Toggle */}
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl border border-surface-200 dark:border-surface-700">
               <button
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                   scope === 'frame' ? "bg-white dark:bg-surface-600 text-black dark:text-white shadow-sm" : "text-surface-500 hover:text-surface-900 dark:hover:text-white"
                 )}
                 onClick={() => setScope('frame')}
               >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Single Frame
               </button>
               <button
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                   scope === 'sequence' ? "bg-[#ffe98a] text-black shadow-sm" : "text-surface-500 hover:text-surface-900 dark:hover:text-white"
                 )}
                 onClick={() => setScope('sequence')}
               >
                  <Layers className="w-3.5 h-3.5" />
                  Full Tactic
               </button>
            </div>

            <Button 
              variant="retro"
              size="lg"
              className="w-full h-14 relative group overflow-hidden"
              onClick={fetchInsights}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                   <Loader2 className="w-5 h-5 animate-spin text-retro-mustard" />
                   <span className="text-[11px] font-black uppercase tracking-widest">Scanning Board...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                   <Zap className="w-5 h-5 fill-retro-mustard text-retro-mustard group-hover:scale-125 transition-transform" />
                   <span className="text-[11px] font-black uppercase tracking-widest">Generate {userMode} Insights</span>
                </div>
              )}
            </Button>
            
            {error && (
              <div className="mt-2 p-3 rounded-xl bg-retro-burgundy/10 border border-retro-burgundy/20 flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 text-retro-burgundy shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-retro-burgundy">{error}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Analysis Header */}
            <Card className="bg-surface-50 dark:bg-surface-800 border-none shadow-material-1">
               <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-retro-mustard flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Analysis Ready
                     </span>
                     <button 
                       onClick={() => setAiResult(null)}
                       className="text-surface-400 hover:text-retro-burgundy transition-colors"
                     >
                       <RefreshCcw className="w-3.5 h-3.5" />
                     </button>
                  </div>
                  <h4 className="text-sm font-black text-retro-ink dark:text-white uppercase leading-tight">{aiResult.title}</h4>
                  <p className="text-[11px] text-surface-600 dark:text-surface-400 mt-2 font-medium leading-relaxed italic border-l-2 border-retro-mustard pl-3">
                    "{aiResult.formation_summary}"
                  </p>
               </CardContent>
            </Card>

            {/* Speaking Points */}
            <Card className="border-none bg-surface-100/50 dark:bg-surface-900 shadow-none">
               <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-surface-500 flex items-center gap-2">
                    <MessageSquareQuote className="w-3.5 h-3.5" /> Coach's Notes
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <ul className="space-y-2">
                    {aiResult.speaking_points?.map((pt: string, i: number) => (
                      <li key={i} className="text-[11px] font-medium text-surface-700 dark:text-surface-300 flex items-start gap-2">
                         <span className="text-retro-mustard font-black mt-0.5">•</span>
                         {pt}
                      </li>
                    ))}
                  </ul>
               </CardContent>
            </Card>

            {/* Risks Section */}
            <Card className="border-2 border-retro-burgundy/10 bg-retro-burgundy/5 dark:bg-retro-burgundy/10 shadow-none">
               <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-retro-burgundy flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" /> Structural Risks
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                  <ul className="space-y-2">
                    {aiResult.risks?.map((pt: string, i: number) => (
                      <li key={i} className="text-[11px] font-bold text-retro-burgundy flex items-start gap-2">
                         <span className="opacity-50 mt-0.5">⚠️</span>
                         {pt}
                      </li>
                    ))}
                  </ul>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
