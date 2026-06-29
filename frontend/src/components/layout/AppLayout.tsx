import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import { PresentationControls } from '@/components/PresentationControls';

interface AppLayoutProps {
  topBar: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar?: React.ReactNode;
  timeline?: React.ReactNode;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  topBar,
  leftSidebar,
  rightSidebar,
  timeline,
  children
}) => {
  const isPresenting = useEditorStore((s: any) => s.isPresenting);
  const isDarkMode = useEditorStore((s: any) => s.isDarkMode);

  React.useEffect(() => {
    if (isDarkMode || isPresenting) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, isPresenting]);

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden flex flex-col transition-colors duration-500",
      (isPresenting || isDarkMode) ? "bg-surface-950 dark" : "bg-[#fffdf7]"
    )}>
      {/* Background Texture (Vintage Paper Feel) */}
      {!isPresenting && (
        <>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] mix-blend-multiply z-0" />
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-multiply z-0" />
        </>
      )}


      <div className="flex flex-col w-full h-full p-3 gap-3 relative z-10">
        {/* Top Header */}
        <AnimatePresence>
          {!isPresenting && (
            <motion.header
              initial={{ y: -56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -56, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="relative z-[120] flex-shrink-0 overflow-visible"
            >
              {topBar}
            </motion.header>
          )}
        </AnimatePresence>

        {/* Middle Area */}
        <div className="flex flex-1 gap-3 min-h-0 relative z-[10]">
          {/* Left Toolbar / Sidebar */}
          <AnimatePresence>
            {!isPresenting && (
              <motion.aside
                initial={{ x: -64, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 'auto' }}
                exit={{ x: -64, opacity: 0, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                className="relative z-[40] h-full flex-shrink-0"
              >
                {leftSidebar}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Canvas Area */}
          <main className="flex-1 relative overflow-hidden flex items-center justify-center rounded-2xl bg-[#fff] border-[3px] border-black shadow-[6px_6px_0_#121212] z-0 p-2">
            {/* Pitch Area Vignette */}
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_150px_rgba(0,0,0,0.3)] rounded-2xl" />
            
            {children}
            
            {/* Floating Presentation Controls */}
            <AnimatePresence>
              {isPresenting && (
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50"
                >
                  <PresentationControls />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Inspector Panel */}
          <AnimatePresence>
            {!isPresenting && rightSidebar && (
              <motion.aside
                initial={{ x: 320, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 'auto' }}
                exit={{ x: 320, opacity: 0, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                className="relative z-[40] h-full flex-shrink-0"
              >
                {rightSidebar}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Timeline */}
        <AnimatePresence>
          {!isPresenting && timeline && (
            <motion.footer
              initial={{ y: 140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 140, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="relative z-[30] flex-shrink-0"
            >
              {timeline}
            </motion.footer>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};
