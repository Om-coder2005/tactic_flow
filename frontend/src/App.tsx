// ============================================
// TacticFlow — App Root
// Layout: TopBar + LeftToolbar + Canvas + Timeline
// ============================================

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthPage } from '@/features/auth/AuthPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TopBar } from '@/components/TopBar';
import { LeftToolbar } from '@/components/LeftToolbar';
import { RightPanel } from '@/components/RightPanel';
import { PitchStage } from '@/features/canvas/PitchStage';
import { FrameTimeline } from '@/features/timeline/FrameTimeline';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { v4 as uuidv4 } from 'uuid';
import type { Frame } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useAutoSave, restoreProjectFromStorage } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AppLayout } from '@/components/layout/AppLayout';

const BoardApp: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Sync Hooks
  useAutoSave();
  useKeyboardShortcuts();
  
  useEffect(() => {
    const initDraft = async () => {
      // If there's an ID, try loading it first
      if (id && id !== 'local-draft') {
        // We set it to local storage to reuse the existing restoreProjectFromStorage flow
        localStorage.setItem('tf_active_project_id', id);
        const restored = await restoreProjectFromStorage();
        if (restored) return; // Loaded successfully
      }

      // No saved project or load failed — initialize a fresh local-draft board
      const store = useProjectStore.getState();
      if (store.frames.length > 0) return;

      const projectId = 'local-draft';
      const frame: Frame = {
        id: uuidv4(),
        project_id: projectId,
        name: 'Frame 1',
        phase_label: null,
        order_index: 0,
        duration_ms: 1800,
        snapshot: {
          schema_version: 1,
          pitch_type: 'full',
          theme: 'classic_green',
          objects: [],
        },
      };
      store.setFrames([frame]);
      store.setActiveFrame(frame.id);
      useEditorStore.getState().pushHistory(frame.snapshot);
    };
    initDraft();
  }, []);

  return (
    <AppLayout
      topBar={<TopBar />}
      leftSidebar={<LeftToolbar />}
      rightSidebar={<RightPanel />}
      timeline={<FrameTimeline />}
    >
      <PitchStage />
    </AppLayout>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loadAuthContext } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAuthContext().then(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950 text-white">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/boards" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/boards/:id" element={<ProtectedRoute><BoardApp /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/boards" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
