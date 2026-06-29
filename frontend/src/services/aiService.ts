import { apiClient } from '@/lib/apiClient';

export const aiService = {
  async getTacticalSummary(projectId: string, frameId: string, snapshot: any, mode: string = 'analytical') {
    return apiClient<any>(`/projects/${projectId}/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify({
        frame_id: frameId,
        snapshot,
        mode,
      }),
    });
  },
  async getSequenceSummary(projectId: string, snapshots: any[], mode: string = 'analytical') {
    return apiClient<any>(`/projects/${projectId}/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify({
        snapshots,
        mode,
      }),
    });
  }
};
