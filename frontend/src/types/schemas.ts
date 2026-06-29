// ============================================
// TacticFlow — Core Schemas
// Matching Sections 5.2–5.4 of the spec
// ============================================

import type { TacticalObject } from './tactical-objects';

// ---------- Pitch ----------

export type PitchType = 'full' | 'half' | 'attacking_third' | 'plain';
export type PitchTheme = 'classic_green' | 'tactical_dark' | 'minimal' | 'wc_qatar' | 'wc_brasil' | 'wc_classic' | 'wc_russia';

// ---------- Board Snapshot (Section 5.2) ----------

export interface BoardSnapshot {
  schema_version: number; // current: 1
  pitch_type: PitchType;
  theme: PitchTheme;
  objects: TacticalObject[];
}

// ---------- Frame (Section 5.3) ----------

export type PhaseLabel =
  | 'build_up'
  | 'mid_block'
  | 'high_press'
  | 'rest_defence'
  | 'final_third'
  | null;

export interface Frame {
  id: string;
  project_id: string;
  name: string;
  phase_label: PhaseLabel;
  order_index: number;
  duration_ms: number; // 500–10000, default 1800
  snapshot: BoardSnapshot;
  version?: number;
}

// ---------- Formation Template (Section 5.4) ----------

export type FormationFormat = '11v11' | '7v7' | '5v5' | 'futsal';
export type FormationCategory = 'balanced' | 'attacking' | 'defensive';

export interface FormationNode {
  role: string; // GK | RB | CB | LB | CDM | CM | CAM | RW | LW | ST | etc
  x: number; // pitch-relative 0–100
  y: number; // pitch-relative 0–100
}

export interface FormationTemplate {
  id: string;
  name: string;
  format: FormationFormat;
  category: FormationCategory;
  is_builtin: boolean;
  owner_user_id: string | null;
  nodes: FormationNode[];
}

// ---------- Project ----------

export interface Project {
  id: string;
  user_id: string;
  title: string;
  pitch_type: PitchType;
  theme: PitchTheme;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Board ----------

export interface Viewport {
  zoom: number;
  x: number;
  y: number;
}

export interface Board {
  id: string;
  project_id: string;
  viewport: Viewport;
  active_frame_id: string | null;
  schema_version: number;
  updated_at: string;
}

// ---------- Export Job ----------

export type ExportType = 'png' | 'jpg' | 'pdf';
export type ExportPreset = 'instagram' | 'youtube' | 'slide' | 'a4' | 'custom';
export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJob {
  id: string;
  project_id: string;
  user_id: string;
  type: ExportType;
  status: ExportStatus;
  download_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- AI Summary ----------

export type SummaryScope = 'current_frame' | 'selected_frames' | 'full_sequence';
export type SummaryMode = 'coach' | 'analyst' | 'content_creator' | 'simple';
export type SummaryTone = 'concise' | 'balanced' | 'detailed';

export interface AISummary {
  id: string;
  project_id: string;
  user_id: string;
  scope: SummaryScope;
  mode: SummaryMode;
  tone: SummaryTone;
  status: 'processing' | 'completed' | 'failed';
  is_pinned: boolean;
  output: TacticalSummaryOutput | null;
  created_at: string;
  updated_at: string;
}

export interface TacticalSummaryOutput {
  title: string;
  formation_summary: string;
  shape_summary: string;
  short_summary: string;
  detailed_explanation: string[];
  speaking_points: string[];
  phase_observations: PhaseObservation[];
  risks: string[];
  caption_ideas: string[];
  confidence: ConfidenceBlock;
}

export interface PhaseObservation {
  frame_name: string;
  observation: string;
}

export interface ConfidenceBlock {
  overall: number; // 0.0–1.0, injected by backend
  notes: string[]; // LLM-generated
}

// ---------- Auth ----------

export type UserRole = 'user' | 'guest' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
