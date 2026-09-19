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
      const apiMode = 'analytical';
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
    <div className="flex flex-col gap-3 text-[#1f2421]">
      <AnimatePresence mode="wait">
        {!aiResult ? (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-2.5"
          >
            {/* Scope Toggle */}
            <div className="flex bg-[#f4f5f1] p-1 rounded-xl border border-[#e2e4df]">
               <button
                 className={cn(
                   "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                   scope === 'frame' ? "bg-white text-[#1f2421] shadow-sm border border-[#d0d3c9]" : "text-[#5c635e] hover:text-[#1f2421]"
                 )}
                 onClick={() => setScope('frame')}
               >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Single Frame
               </button>
               <button
                 className={cn(
                   "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                   scope === 'sequence' ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-sm" : "text-[#5c635e] hover:text-[#1f2421]"
                 )}
                 onClick={() => setScope('sequence')}
               >
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Full Tactic
               </button>
            </div>

            <button 
              className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              onClick={fetchInsights}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin text-white" />
                   <span>Scanning Board...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   <Zap className="w-4 h-4 fill-current text-amber-100" />
                   <span>Generate AI Insights</span>
                </div>
              )}
            </button>
            
            {error && (
              <div className="mt-1 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                 <p className="text-[10px] font-semibold text-red-700">{error}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Analysis Header */}
            <Card className="bg-[#f9faf8] border border-[#e2e4df] shadow-sm rounded-xl">
               <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Analysis Ready
                     </span>
                     <button 
                       onClick={() => setAiResult(null)}
                       className="text-[#5c635e] hover:text-[#1f2421] transition-colors"
                     >
                       <RefreshCcw className="w-3.5 h-3.5" />
                     </button>
                  </div>
                  <h4 className="text-xs font-bold text-[#1f2421] uppercase leading-tight">{aiResult.title}</h4>
                  <p className="text-[11px] text-[#5c635e] mt-1.5 font-medium leading-relaxed italic border-l-2 border-amber-500 pl-2.5">
                    "{aiResult.formation_summary}"
                  </p>
               </CardContent>
            </Card>

            {/* Speaking Points */}
            <Card className="border border-[#e2e4df] bg-[#f9faf8] shadow-sm rounded-xl">
               <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#5c635e] flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" /> Coach's Notes
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-3 pt-0">
                  <ul className="space-y-1.5">
                    {aiResult.speaking_points?.map((pt: string, i: number) => (
                      <li key={i} className="text-[11px] font-medium text-[#1f2421] flex items-start gap-1.5">
                         <span className="text-amber-600 font-bold mt-0.5">•</span>
                         {pt}
                      </li>
                    ))}
                  </ul>
               </CardContent>
            </Card>

            {/* Risks Section */}
            <Card className="border border-amber-200 bg-amber-50/60 shadow-sm rounded-xl">
               <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> Structural Risks
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-3 pt-0">
                  <ul className="space-y-1.5">
                    {aiResult.risks?.map((pt: string, i: number) => (
                      <li key={i} className="text-[11px] font-semibold text-amber-900 flex items-start gap-1.5">
                         <span className="mt-0.5">⚠️</span>
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
