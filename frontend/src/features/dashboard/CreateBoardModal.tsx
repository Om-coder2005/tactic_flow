import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, pitchType: string, theme: string) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('New Tactics Board');
  const [pitchType, setPitchType] = useState('full');
  const [theme, setTheme] = useState('classic_green');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#fffdf7] dark:bg-surface-900 border-[4px] border-black rounded-2xl shadow-[12px_12px_0_#121212] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-[4px] border-black bg-white dark:bg-surface-800">
            <h2 className="text-2xl font-black uppercase tracking-tight">Create New Board</h2>
            <button
              onClick={onClose}
              className="p-2 border-2 border-transparent hover:border-black rounded-lg transition-colors"
            >
              <X size={24} className="text-black dark:text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-surface-600 dark:text-surface-400">Board Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-surface-950 border-[3px] border-black rounded-xl font-medium focus:outline-none focus:ring-0 focus:border-retro-blue transition-colors shadow-[4px_4px_0_#121212]"
                placeholder="e.g. High Press Tactics"
              />
            </div>

            {/* Pitch Type */}
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-surface-600 dark:text-surface-400">Pitch Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['full', 'half', 'attacking_third'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPitchType(type)}
                    className={`px-4 py-3 border-[3px] border-black rounded-xl font-bold uppercase text-xs transition-all ${
                      pitchType === type
                        ? 'bg-[#ffd400] shadow-[4px_4px_0_#121212] -translate-y-1 text-black'
                        : 'bg-white text-surface-500 hover:bg-surface-100'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-surface-600 dark:text-surface-400">Pitch Theme</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'classic_green', label: 'Classic Green', color: 'bg-green-600' },
                  { id: 'tactical_dark', label: 'Tactical Dark', color: 'bg-surface-800' },
                  { id: 'retro', label: 'Retro Notebook', color: 'bg-[#fffdf7]' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-3 px-4 py-3 border-[3px] border-black rounded-xl font-bold uppercase text-xs transition-all ${
                      theme === t.id
                        ? 'bg-retro-burgundy shadow-[4px_4px_0_#121212] -translate-y-1 text-white'
                        : 'bg-white text-surface-500 hover:bg-surface-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 border-black ${t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t-[4px] border-black bg-surface-50 dark:bg-surface-950 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 font-black uppercase text-surface-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(title, pitchType, theme)}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white font-black uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0_#121212] hover:translate-y-1 hover:shadow-[0_0_0_#121212] transition-all"
            >
              <Check size={20} />
              Create Board
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
