import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tacticService } from '@/services/tacticService';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { PlusIcon, TrashIcon, ClockIcon, Layout } from 'lucide-react';
import { CreateBoardModal } from './CreateBoardModal';
import { cn } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const resetProject = useProjectStore((s) => s.resetProject);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await tacticService.getProjects();
        setProjects(data);
      } catch (e) {
        console.error('Failed to load projects', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (title: string, pitchType: string, theme: string) => {
    try {
      const p = await tacticService.createProject(title, pitchType as any);
      // Currently the backend doesn't accept theme on creation easily or we can just navigate and set it.
      // Assuming tacticService.createProject takes care of it, or we just navigate
      resetProject();
      navigate(`/boards/${p.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tacticService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf7] dark:bg-surface-950 text-retro-ink dark:text-surface-50 p-8 flex flex-col selection:bg-[#ffd400] selection:text-black">
      {/* Texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] mix-blend-multiply z-0" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-12 border-b-[4px] border-black pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffd400] border-[3px] border-black flex items-center justify-center transform -rotate-3 shadow-[4px_4px_0_#121212]">
              <span className="text-black font-black text-2xl italic tracking-tighter">TF</span>
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Dashboard</h1>
              <p className="text-surface-600 dark:text-surface-400 font-bold tracking-wide mt-1">COACH {user?.name?.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={logout}
              className="px-6 py-3 rounded-xl bg-white border-[3px] border-black hover:-translate-y-1 hover:shadow-[4px_4px_0_#121212] transition-all font-black uppercase text-sm"
            >
              Sign Out
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-retro-burgundy text-white border-[3px] border-black hover:-translate-y-1 hover:shadow-[4px_4px_0_#121212] transition-all font-black uppercase text-sm"
            >
              <PlusIcon size={20} />
              New Board
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-surface-500 font-black uppercase tracking-widest animate-pulse">Loading Boards...</div>
        ) : projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-900 dark:text-white">
            <div className="w-24 h-24 bg-[#ffd400] border-[4px] border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0_#121212] mb-8 transform -rotate-6">
              <Layout size={48} className="text-black" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">No Tactical Boards Yet</h2>
            <p className="text-xl font-medium text-surface-600 dark:text-surface-400 mb-8 max-w-md text-center">
              Create your first board to start drawing tactics and generating AI insights.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-black text-white border-[3px] border-black hover:-translate-y-1 hover:shadow-[6px_6px_0_#121212] transition-all font-black uppercase text-lg"
            >
              <PlusIcon size={24} />
              Create First Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((p) => (
              <div 
                key={p.id}
                onClick={() => {
                  resetProject();
                  navigate(`/boards/${p.id}`);
                }}
                className="group relative bg-white dark:bg-surface-900 border-[3px] border-black rounded-2xl p-6 cursor-pointer hover:-translate-y-2 hover:shadow-[8px_8px_0_#121212] transition-all flex flex-col h-[280px]"
              >
                {/* Delete Button */}
                <button 
                  onClick={(e) => handleDelete(p.id, e)}
                  className="absolute top-4 right-4 p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg z-10 bg-white"
                  title="Delete Board"
                >
                  <TrashIcon size={18} />
                </button>
                
                {/* Stylized Thumbnail Placeholder */}
                <div className={cn(
                  "w-full h-32 rounded-xl border-2 border-black mb-4 flex flex-col justify-center items-center relative overflow-hidden",
                  p.theme === 'tactical_dark' ? 'bg-surface-800' : 'bg-grass-600'
                )}>
                  <div className="absolute inset-2 border-2 border-white/30 rounded-lg" />
                  <div className="absolute w-12 h-12 border-2 border-white/30 rounded-full" />
                  <div className="absolute w-0.5 h-full bg-white/30" />
                </div>

                <h3 className="text-xl font-black uppercase tracking-tight mb-2 truncate pr-8">{p.title}</h3>
                
                <div className="flex items-center gap-2 mb-auto">
                  <span className="px-2.5 py-1 bg-[#ffd400] text-black border-2 border-black rounded-md uppercase text-[10px] font-black">{p.pitch_type.replace('_', ' ')}</span>
                  <span className="px-2.5 py-1 bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-2 border-black rounded-md uppercase text-[10px] font-black truncate">{p.theme.replace('_', ' ')}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-surface-500 text-xs font-bold uppercase mt-4 pt-4 border-t-[3px] border-black">
                  <ClockIcon size={14} />
                  <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateBoardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateProject} 
      />
    </div>
  );
};
