import { JobImportance } from '../types';
import { URGENCY_THRESHOLDS } from '../constants/config';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toLocalDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const startOfDay = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const getDaysUntil = (dateString: string, now = new Date()): number | null => {
  const due = toLocalDate(dateString);
  if (!due) {
    return null;
  }
  const today = startOfDay(now);
  const dueDay = startOfDay(due);
  return Math.round((dueDay.getTime() - today.getTime()) / MS_PER_DAY);
};

export const getUrgencyFromDate = (dateString: string, now = new Date()): JobImportance => {
  const daysUntil = getDaysUntil(dateString, now);
  if (daysUntil === null) {
    return 'Medium';
  }
  if (daysUntil <= URGENCY_THRESHOLDS.URGENT) {
    return 'Urgent';
  }
  if (daysUntil <= URGENCY_THRESHOLDS.HIGH) {
    return 'High';
  }
  if (daysUntil <= URGENCY_THRESHOLDS.MEDIUM) {
    return 'Medium';
  }
  return 'Low';
};

export const formatDueLabel = (dateString: string, now = new Date()): string => {
  const daysUntil = getDaysUntil(dateString, now);
  if (daysUntil === null) {
    return 'No due date';
  }
  if (daysUntil === 0) {
    return 'Due Today';
  }
  if (daysUntil === 1) {
    return 'Due Tomorrow';
  }
  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil);
    return `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
  }
  if (daysUntil >= 14) {
    const weeks = Math.max(2, Math.round(daysUntil / 7));
    return `Due in ${weeks} weeks`;
  }
  return `Due in ${daysUntil} days`;
};
