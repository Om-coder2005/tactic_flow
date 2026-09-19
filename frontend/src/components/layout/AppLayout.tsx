import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editorStore';
import { PresentationControls } from '@/components/PresentationControls';
import { MobileDrawers } from '@/components/MobileDrawers';

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
  const isInspectorOpen = useEditorStore((s: any) => s.isInspectorOpen);
  const setInspectorOpen = useEditorStore((s: any) => s.setInspectorOpen);

  React.useEffect(() => {
    if (isDarkMode || isPresenting) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, isPresenting]);

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden flex flex-col transition-colors duration-300 select-none",
      isPresenting ? "bg-black text-white" : "bg-[#f2f3f0] text-[#1f2421]"
    )}>
      {/* Mobile Slide-Up Drawers (OVERLAYS, FORMATIONS, SETTINGS, TOOLS) */}
      {!isPresenting && <MobileDrawers />}

      {/* Subtle Light Grid Texture */}
      {!isPresenting && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0 opacity-60" />
      )}

      <div className="flex flex-col w-full h-full p-2 sm:p-2.5 gap-2 sm:gap-2.5 relative z-10">
        {/* Top Header */}
        <AnimatePresence>
          {!isPresenting && (
            <motion.header
              initial={{ y: -48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -48, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 150 }}
              className="relative z-[120] flex-shrink-0 overflow-visible"
            >
              {topBar}
            </motion.header>
          )}
        </AnimatePresence>

        {/* Middle Area */}
        <div className="flex flex-1 gap-2 sm:gap-2.5 min-h-0 relative z-[10]">
          {/* Left Toolbar / Dock (Desktop vertical >=768px) */}
          <AnimatePresence>
            {!isPresenting && (
              <motion.aside
                initial={{ x: -56, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -56, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 160 }}
                className="hidden md:block relative z-[40] h-full flex-shrink-0"
              >
                {leftSidebar}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Canvas Container */}
          <main className="flex-1 relative overflow-hidden flex items-center justify-center rounded-2xl bg-white border border-[#e2e4df] shadow-[0_2px_12px_rgba(0,0,0,0.04)] z-0 p-1 sm:p-1.5 backdrop-blur-sm min-w-0 min-h-0">
            {/* Pitch Area Soft Inner Vignette Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.06)] rounded-2xl" />
            
            {children}
            
            {/* Floating Presentation Controls */}
            <AnimatePresence>
              {isPresenting && (
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                  <PresentationControls />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Inspector Panel - Desktop Inline (>=1024px) */}
          <AnimatePresence>
            {!isPresenting && rightSidebar && isInspectorOpen && (
              <motion.aside
                key="desktop-inspector-panel"
                initial={{ x: 300, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 'auto' }}
                exit={{ x: 300, opacity: 0, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 160 }}
                className="hidden lg:block relative z-[40] h-full flex-shrink-0"
              >
                {rightSidebar}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Right Inspector Panel - Mobile/Tablet Drawer Sheet (<1024px) */}
          <AnimatePresence>
            {!isPresenting && rightSidebar && isInspectorOpen && (
              <motion.div
                key="mobile-inspector-drawer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-[150] flex justify-end"
              >
                {/* Backdrop */}
                <div 
                  onClick={() => setInspectorOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
                />
                {/* Sheet Content */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative z-10 h-full p-2 max-w-[340px] w-full"
                >
                  {rightSidebar}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Horizontal Tool Dock (<768px) */}
        <AnimatePresence>
          {!isPresenting && (
            <div className="md:hidden relative z-[40] flex-shrink-0 w-full">
              {leftSidebar}
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Timeline Bar */}
        <AnimatePresence>
          {!isPresenting && timeline && (
            <motion.footer
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 150 }}
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


