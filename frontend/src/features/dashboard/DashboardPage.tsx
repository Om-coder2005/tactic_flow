import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tacticService } from '@/services/tacticService';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { PlusIcon, TrashIcon, ClockIcon } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleCreate = async () => {
    try {
      const p = await tacticService.createProject('New Tactics Board', 'full');
      resetProject(); // Clear any existing loaded board
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 p-8 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">TacticFlow Dashboard</h1>
          <p className="text-surface-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 transition font-medium"
          >
            Sign Out
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition font-medium shadow-md shadow-primary-500/20"
          >
            <PlusIcon size={20} />
            New Board
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-surface-500">Loading boards...</div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
          <div className="p-6 bg-surface-200 dark:bg-surface-800 rounded-full mb-6">
            <PlusIcon size={48} className="text-surface-500 dark:text-surface-400" />
          </div>
          <p className="text-2xl font-semibold text-surface-900 dark:text-surface-50">No boards found</p>
          <p className="mt-2 text-surface-500">Create your first tactical board to get started.</p>
          <button 
            onClick={handleCreate}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition font-medium shadow-md shadow-primary-500/20"
          >
            <PlusIcon size={20} />
            Create First Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div 
              key={p.id}
              onClick={() => {
                resetProject();
                navigate(`/boards/${p.id}`);
              }}
              className="group relative bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded-xl p-6 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <button 
                onClick={(e) => handleDelete(p.id, e)}
                className="absolute top-4 right-4 p-2 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition bg-surface-100 dark:bg-surface-800 rounded-lg"
                title="Delete Board"
              >
                <TrashIcon size={18} />
              </button>
              
              <h3 className="text-xl font-semibold mb-2 truncate pr-10">{p.title}</h3>
              <div className="flex items-center gap-2 text-surface-500 text-sm mb-6">
                <span className="px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded capitalize text-xs font-medium">{p.pitch_type}</span>
                <span className="px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded capitalize text-xs font-medium">{p.theme.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-1 text-surface-400 text-xs mt-auto pt-4 border-t border-surface-100 dark:border-surface-600">
                <ClockIcon size={14} />
                <span>Updated {new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
