import { JobStatus } from '../types';

export const formatStatus = (status: JobStatus): string =>
  status
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export const formatCurrency = (amount: number): string =>
  `$${amount.toFixed(2)}`;

export const formatDateISO = (date: Date = new Date()): string =>
  date.toISOString().split('T')[0];
