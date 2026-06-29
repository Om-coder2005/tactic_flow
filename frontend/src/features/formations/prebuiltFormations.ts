// ============================================
// TacticFlow — Prebuilt Formation Templates
// Fixed coordinate maps for 11v11, 7v7, 5v5
// ============================================

export type FormationNodeDef = {
  role: string;
  x: number; // Pitch-relative % (0-100)
  y: number; // Pitch-relative % (0-100)
};

export interface FormationTemplateDef {
  id: string;
  name: string;
  format: '11v11' | '7v7' | '5v5' | 'futsal';
  category: 'balanced' | 'attacking' | 'defensive';
  is_builtin: boolean;
  nodes: FormationNodeDef[];
}

// 11v11 Configurations mapped to the Left (Home) side of the pitch
export const PREBUILT_FORMATIONS: FormationTemplateDef[] = [
  {
    id: 'fmt_433_flat',
    name: '4-3-3 Flat',
    format: '11v11',
    category: 'attacking',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LB', x: 20, y: 15 },
      { role: 'CB', x: 15, y: 38 },
      { role: 'CB', x: 15, y: 62 },
      { role: 'RB', x: 20, y: 85 },
      { role: 'LCM', x: 32, y: 28 },
      { role: 'CM', x: 28, y: 50 },
      { role: 'RCM', x: 32, y: 72 },
      { role: 'LW', x: 45, y: 15 },
      { role: 'ST', x: 42, y: 50 },
      { role: 'RW', x: 45, y: 85 },
    ],
  },
  {
    id: 'fmt_4231',
    name: '4-2-3-1',
    format: '11v11',
    category: 'balanced',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LB', x: 20, y: 15 },
      { role: 'CB', x: 15, y: 38 },
      { role: 'CB', x: 15, y: 62 },
      { role: 'RB', x: 20, y: 85 },
      { role: 'LDM', x: 28, y: 35 },
      { role: 'RDM', x: 28, y: 65 },
      { role: 'LAM', x: 38, y: 20 },
      { role: 'CAM', x: 36, y: 50 },
      { role: 'RAM', x: 38, y: 80 },
      { role: 'ST', x: 46, y: 50 },
    ],
  },
  {
    id: 'fmt_442_classic',
    name: '4-4-2 Classic',
    format: '11v11',
    category: 'balanced',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LB', x: 20, y: 15 },
      { role: 'CB', x: 15, y: 38 },
      { role: 'CB', x: 15, y: 62 },
      { role: 'RB', x: 20, y: 85 },
      { role: 'LM', x: 35, y: 15 },
      { role: 'CM', x: 32, y: 38 },
      { role: 'CM', x: 32, y: 62 },
      { role: 'RM', x: 35, y: 85 },
      { role: 'ST', x: 45, y: 40 },
      { role: 'ST', x: 45, y: 60 },
    ],
  },
  {
    id: 'fmt_352',
    name: '3-5-2',
    format: '11v11',
    category: 'attacking',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LCB', x: 16, y: 30 },
      { role: 'CB', x: 14, y: 50 },
      { role: 'RCB', x: 16, y: 70 },
      { role: 'LWB', x: 26, y: 12 },
      { role: 'LCM', x: 32, y: 33 },
      { role: 'CDM', x: 26, y: 50 },
      { role: 'RCM', x: 32, y: 67 },
      { role: 'RWB', x: 26, y: 88 },
      { role: 'ST', x: 45, y: 40 },
      { role: 'ST', x: 45, y: 60 },
    ],
  },
  {
    id: 'fmt_541',
    name: '5-4-1',
    format: '11v11',
    category: 'defensive',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LWB', x: 18, y: 12 },
      { role: 'LCB', x: 15, y: 30 },
      { role: 'CB', x: 13, y: 50 },
      { role: 'RCB', x: 15, y: 70 },
      { role: 'RWB', x: 18, y: 88 },
      { role: 'LM', x: 30, y: 20 },
      { role: 'CM', x: 28, y: 40 },
      { role: 'CM', x: 28, y: 60 },
      { role: 'RM', x: 30, y: 80 },
      { role: 'ST', x: 44, y: 50 },
    ],
  },
  // Small sided examples
  {
    id: 'fmt_7v7_231',
    name: '2-3-1 (7v7)',
    format: '7v7',
    category: 'balanced',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'LB', x: 18, y: 30 },
      { role: 'RB', x: 18, y: 70 },
      { role: 'LM', x: 35, y: 20 },
      { role: 'CM', x: 30, y: 50 },
      { role: 'RM', x: 35, y: 80 },
      { role: 'ST', x: 45, y: 50 },
    ],
  },
  {
    id: 'fmt_5v5_diamond',
    name: '1-2-1 Diamond (5v5)',
    format: '5v5',
    category: 'balanced',
    is_builtin: true,
    nodes: [
      { role: 'GK', x: 5, y: 50 },
      { role: 'CB', x: 16, y: 50 },
      { role: 'LM', x: 28, y: 25 },
      { role: 'RM', x: 28, y: 75 },
      { role: 'ST', x: 40, y: 50 },
    ],
  }
];
