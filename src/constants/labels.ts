import { JobCategory } from '../types';

export const CATEGORY_LABELS: Record<JobCategory, string> = {
  Repair: 'Repair',
  Fabrication: 'Fabrication',
  'Deliveries and Dispatch': 'Deliveries & Dispatch',
};

export const UNIT_OPTIONS = ['', 'in', 'ft', 'mm', 'cm'] as const;
export type MeasurementUnit = typeof UNIT_OPTIONS[number];
