import { apiClient } from '@/lib/apiClient';
import type { BoardSnapshot } from '@/types';

export const tacticService = {
  async createProject(title: string, pitchType = 'full') {
    return apiClient<any>('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, pitch_type: pitchType }),
    });
  },

  async getProject(projectId: string) {
    return apiClient<any>(`/projects/${projectId}`);
  },

  async getProjects() {
    return apiClient<any[]>('/projects');
  },

  async deleteProject(projectId: string) {
    return apiClient<any>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async updateBoard(projectId: string, boardId: string, payload: any) {
    return apiClient<any>(`/projects/${projectId}/board`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async createFrame(projectId: string, payload: any) {
    return apiClient<any>(`/projects/${projectId}/frames`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSnapshot(projectId: string, frameId: string, snapshot: BoardSnapshot) {
    return apiClient<any>(`/projects/${projectId}/frames/${frameId}`, {
      method: 'PUT',
      body: JSON.stringify({ snapshot }),
    });
  },
  
  async batchUpdateFrames(projectId: string, frames: any[]) {
    return apiClient<any[]>(`/projects/${projectId}/frames/batch`, {
      method: 'POST',
      body: JSON.stringify(frames),
    });
  },

  async getFormations() {
    return apiClient<any>('/formations');
  },

  async createFormation(payload: any) {
    return apiClient<any>('/formations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteFormation(formationId: string) {
    return apiClient<any>(`/formations/${formationId}`, {
      method: 'DELETE',
    });
  }
};
