import React, { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { apiClient } from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileJson, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Monitor,
  Smartphone,
  Presentation
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { createPortal } from 'react-dom';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [preset, setPreset] = useState('youtube');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeFrameId = useProjectStore(s => s.activeFrameId);
  const frames = useProjectStore(s => s.frames);
  const setActiveFrame = useProjectStore(s => s.setActiveFrame);

  const startExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadFrames: { frame_id: string; base64_image: string }[] = [];
      const originalFrame = activeFrameId;
      
      if (format === 'png') {
        const image = (window as any).__exportActiveFrame?.();
        if (image) {
          payloadFrames.push({ frame_id: activeFrameId || 'f1', base64_image: image });
        }
      } else {
        for (const f of frames) {
          setActiveFrame(f.id);
          await new Promise(r => setTimeout(r, 100)); 
          const image = (window as any).__exportActiveFrame?.();
          if (image) {
            payloadFrames.push({ frame_id: f.id, base64_image: image });
          }
        }
        if (originalFrame) setActiveFrame(originalFrame);
      }
      
      if (payloadFrames.length === 0) throw new Error("Failed to capture canvas frames");

      const response = await apiClient<any>(`/exports`, {
        method: 'POST',
        body: JSON.stringify({ type: format, preset, frames: payloadFrames })
      });

      const jobId = response.job_id;
      if (!jobId) throw new Error("No job ID returned");

      let downloadUrl = null;
      while (true) {
        await new Promise(r => setTimeout(r, 1000));
        const statusRes = await apiClient<any>(`/exports/${jobId}`);
        if (statusRes.status === 'completed') {
          downloadUrl = statusRes.download_url;
          break;
        } else if (statusRes.status === 'failed') {
          throw new Error(statusRes.error_message || "Export job failed");
        }
      }

      const token = localStorage.getItem('tf_access_token');
      const dlResponse = await fetch(`http://localhost:8000${downloadUrl}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!dlResponse.ok) throw new Error("Download failed");
      
      const blob = await dlResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `tacticflow_export_${preset}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An error occurred during export");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-retro-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <Card className="shadow-material-3 border-none bg-white dark:bg-surface-900 overflow-hidden">
           <CardHeader className="bg-retro-ink p-6 flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-retro-mustard flex items-center justify-center text-retro-ink">
                    <Download className="w-5 h-5" />
                 </div>
                 <div>
                    <CardTitle className="text-white text-lg uppercase tracking-tight font-black">Export Studio</CardTitle>
                    <p className="text-[10px] font-bold text-retro-mustard uppercase tracking-widest opacity-80">Production Delivery v2.1</p>
                 </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={onClose}>
                 <X className="w-5 h-5" />
              </Button>
           </CardHeader>

           <CardContent className="p-8 space-y-8">
              {error && (
                <div className="bg-retro-burgundy/10 border-2 border-retro-burgundy/20 rounded-2xl p-4 flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-retro-burgundy shrink-0" />
                   <p className="text-xs font-bold text-retro-burgundy">{error}</p>
                </div>
              )}

              {/* Format Selection */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 pl-1">Target Format</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormat('png')}
                      className={cn(
                        "relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        format === 'png' 
                          ? "border-retro-mustard bg-retro-cream/20 shadow-material-1 scale-[1.02]" 
                          : "border-surface-100 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-700"
                      )}
                    >
                       <ImageIcon className={cn("w-8 h-8", format === 'png' ? "text-retro-mustard" : "text-surface-300")} />
                       <div className="text-center">
                          <p className={cn("text-xs font-black uppercase", format === 'png' ? "text-retro-ink dark:text-white" : "text-surface-400")}>High-Res Image</p>
                          <p className="text-[9px] font-bold text-surface-400 mt-0.5">Single PNG frame</p>
                       </div>
                       {format === 'png' && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-retro-mustard" />}
                    </button>
                    
                    <button
                      onClick={() => setFormat('pdf')}
                      className={cn(
                        "relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        format === 'pdf' 
                          ? "border-retro-mustard bg-retro-cream/20 shadow-material-1 scale-[1.02]" 
                          : "border-surface-100 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-700"
                      )}
                    >
                       <FileText className={cn("w-8 h-8", format === 'pdf' ? "text-retro-mustard" : "text-surface-300")} />
                       <div className="text-center">
                          <p className={cn("text-xs font-black uppercase", format === 'pdf' ? "text-retro-ink dark:text-white" : "text-surface-400")}>Tactical Report</p>
                          <p className="text-[9px] font-bold text-surface-400 mt-0.5">Full multi-frame PDF</p>
                       </div>
                       {format === 'pdf' && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-retro-mustard" />}
                    </button>
                 </div>
              </div>

              {/* Preset Selection */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 pl-1">Resolution Preset</label>
                 <div className="space-y-2">
                    {[
                      { id: 'youtube', label: 'Match Day HUD', res: '1280 × 720', icon: Monitor },
                      { id: 'slide', label: 'Technical Brief', res: '1920 × 1080', icon: Presentation },
                      { id: 'instagram', label: 'Social Feed', res: '1080 × 1350', icon: Smartphone },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPreset(p.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                          preset === p.id 
                            ? "border-retro-ink dark:border-retro-mustard bg-surface-50 dark:bg-surface-800" 
                            : "border-transparent hover:bg-surface-50 dark:hover:bg-surface-800/50"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <p.icon className={cn("w-4 h-4", preset === p.id ? "text-retro-mustard" : "text-surface-400")} />
                            <div className="text-left">
                               <p className="text-[11px] font-black uppercase tracking-tight text-surface-700 dark:text-surface-200">{p.label}</p>
                               <p className="text-[9px] font-bold text-surface-400 uppercase tracking-tighter">{p.res}</p>
                            </div>
                         </div>
                         {preset === p.id && <div className="w-1.5 h-1.5 rounded-full bg-retro-mustard" />}
                      </button>
                    ))}
                 </div>
              </div>

              <Button 
                variant="retro" 
                size="lg" 
                className="w-full"
                onClick={startExport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Assembling Playbook...
                  </>
                ) : (
                  <>
                    Assemble & Download
                    <div className="ml-3 px-2 py-0.5 rounded-md bg-retro-ink text-white text-[9px] font-black">
                      {format.toUpperCase()}
                    </div>
                  </>
                )}
              </Button>
           </CardContent>
        </Card>
      </motion.div>
    </div>,
    document.body
  );
};
