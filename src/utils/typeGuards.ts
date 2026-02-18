/**
 * Type guards for runtime type validation
 * Use these to validate data from external sources like localStorage, Supabase, or CSV imports
 */

import {
  JobCategory,
  JobStatus,
  JobImportance,
  JobItem,
  JobMeasurement,
  JobAttachment,
  AuditAction,
} from '../types';

/**
 * Checks if a value is a valid JobCategory
 */
export const isJobCategory = (value: unknown): value is JobCategory => {
  return (
    typeof value === 'string' &&
    ['Repair', 'Fabrication', 'Deliveries and Dispatch'].includes(value)
  );
};

/**
 * Checks if a value is a valid JobStatus
 */
export const isJobStatus = (value: unknown): value is JobStatus => {
  return (
    typeof value === 'string' &&
    ['complete', 'in progress', 'not started', 'awaiting parts', 'powdercoaters'].includes(value)
  );
};

/**
 * Checks if a value is a valid JobImportance
 */
export const isJobImportance = (value: unknown): value is JobImportance => {
  return typeof value === 'string' && ['Low', 'Medium', 'High', 'Urgent'].includes(value);
};

/**
 * Checks if a value is a valid AuditAction
 */
export const isAuditAction = (value: unknown): value is AuditAction => {
  return (
    typeof value === 'string' &&
    [
      'JOB_CREATED',
      'JOB_UPDATED',
      'STATUS_UPDATED',
      'JOB_DELETED',
      'JOB_RESTORED',
      'JOBS_CLEARED',
      'JOBS_IMPORTED',
    ].includes(value)
  );
};

/**
 * Checks if a value is a valid JobItem
 */
export const isJobItem = (value: unknown): value is JobItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return typeof item.description === 'string' && typeof item.price === 'number';
};

/**
 * Checks if a value is a valid array of JobItems
 */
export const isJobItemArray = (value: unknown): value is JobItem[] => {
  return Array.isArray(value) && value.every(isJobItem);
};

/**
 * Checks if a value is a valid JobMeasurement
 */
export const isMeasurement = (value: unknown): value is JobMeasurement => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const measurement = value as Record<string, unknown>;
  return (
    typeof measurement.label === 'string' &&
    typeof measurement.value === 'string' &&
    typeof measurement.units === 'string'
  );
};

/**
 * Checks if a value is a valid array of JobMeasurements
 */
export const isMeasurementArray = (value: unknown): value is JobMeasurement[] => {
  return Array.isArray(value) && value.every(isMeasurement);
};

/**
 * Checks if a value is a valid JobAttachment
 */
export const isJobAttachment = (value: unknown): value is JobAttachment => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const attachment = value as Record<string, unknown>;
  return typeof attachment.name === 'string' && typeof attachment.dataUrl === 'string';
};

/**
 * Checks if a value is a valid array of JobAttachments
 */
export const isJobAttachmentArray = (value: unknown): value is JobAttachment[] => {
  return Array.isArray(value) && value.every(isJobAttachment);
};

/**
 * Validates a string value and provides a fallback
 */
export const validateString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' ? value : fallback;
};

/**
 * Validates a number value and provides a fallback
 */
export const validateNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' ? value : fallback;
};

/**
 * Validates a boolean value and provides a fallback
 */
export const validateBoolean = (value: unknown, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback;
};
