// IPC Channels
export const IPC_CHANNELS = {
  JOBS_READ: 'diff-king-jobs-read',
  JOBS_WRITE: 'diff-king-jobs-write',
  JOB_PDF: 'diff-king-job-pdf',
  JOB_PRINT: 'diff-king-job-print',
  UPDATE_AVAILABLE: 'diff-king-update-available',
  UPDATE_DOWNLOAD_PROGRESS: 'diff-king-update-download-progress',
  UPDATE_DOWNLOADED: 'diff-king-update-downloaded',
  UPDATE_ERROR: 'diff-king-update-error',
  UPDATE_START_DOWNLOAD: 'diff-king-update-start-download',
  UPDATE_INSTALL: 'diff-king-update-install',
  UPDATE_CHECK: 'diff-king-update-check',
  OPEN_URL: 'diff-king-open-url',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  JOBS: 'diff-king-job-tracker',
  CLIENT_ID: 'diff-king-client-id',
  SETTINGS: 'diff-king-settings',
} as const;

// Database Tables
export const DB_TABLES = {
  JOBS: 'jobs',
  AUDIT: 'job_audit',
  QUERIES: 'queries',
  BOOKINGS: 'bookings',
} as const;

// Timing Constants (in milliseconds)
export const TIMING = {
  SYNC_DEBOUNCE_MS: 500,
  SYNC_RETRY_INTERVAL_MS: 10_000,
  ARCHIVE_CHECK_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  ARCHIVE_AFTER_DAYS: 60,
  AUDIT_LIMIT: 200,
  FILE_WRITE_DEBOUNCE_MS: 600, // debounce disk writes to reduce I/O
} as const;

// Urgency Thresholds (in days)
export const URGENCY_THRESHOLDS = {
  URGENT: 1,
  HIGH: 7,
  MEDIUM: 13,
} as const;

// Window Dimensions
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 760,
  MIN_WIDTH: 900,
  MIN_HEIGHT: 600,
  PRINT_WIDTH: 800,
  PRINT_HEIGHT: 600,
} as const;
