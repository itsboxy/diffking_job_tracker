import { createStore, combineReducers } from 'redux';
import { Job, JobAuditEntry, JobImportance, Query, Booking } from '../types';
import jobReducer, { archiveJobs, replaceJobs, setAudit } from './jobReducer';
import queryReducer, { replaceQueries } from './queryReducer';
import bookingReducer, { replaceBookings } from './bookingReducer';
import {
  fetchSupabaseState,
  startSupabaseSync,
  pushStateToSupabase,
  SupabaseSyncStatus,
} from './supabaseSync';
import { STORAGE_KEYS, TIMING } from '../constants/config';
import { readJobsFile, writeJobsFile } from '../utils/ipc';
import { isSupabaseConfigured } from '../supabaseClient';

const loadFileState = () => {
  const raw = readJobsFile();
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to load saved jobs from file', error);
    return undefined;
  }
};

const loadState = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.JOBS);
    if (!raw) {
      return loadFileState();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to load saved jobs', error);
    return loadFileState();
  }
};

interface PartialState {
  jobs?: {
    jobs?: Array<Partial<Job>>;
    audit?: unknown;
    [key: string]: unknown;
  };
  queries?: {
    queries?: Array<Partial<Query>>;
    [key: string]: unknown;
  };
  bookings?: {
    bookings?: Array<Partial<Booking>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const normalizeState = (state: PartialState | null | undefined): PartialState | undefined => {
  if (!state || !state.jobs || !Array.isArray(state.jobs.jobs)) {
    return undefined;
  }

  return {
    ...state,
    jobs: {
      ...state.jobs,
      jobs: state.jobs.jobs.map((job: Partial<Job>) => ({
        ...job,
        importance: (job.importance || 'Medium') as JobImportance,
        updatedAt: job.updatedAt || new Date().toISOString(),
      })),
      audit: Array.isArray(state.jobs.audit) ? state.jobs.audit : [],
    },
    queries: state.queries && Array.isArray(state.queries.queries) ? {
      ...state.queries,
      queries: state.queries.queries.map((query: Partial<Query>) => ({
        ...query,
        updatedAt: query.updatedAt || new Date().toISOString(),
      })),
    } : { queries: [] },
    bookings: state.bookings && Array.isArray(state.bookings.bookings) ? {
      ...state.bookings,
      bookings: state.bookings.bookings.map((booking: Partial<Booking>) => ({
        ...booking,
        updatedAt: booking.updatedAt || new Date().toISOString(),
      })),
    } : { bookings: [] },
  };
};

const saveState = (state: RootState) => {
  if (typeof window === 'undefined') {
    return;
  }

  // localStorage is fast (in-memory) — write immediately for data safety
  try {
    window.localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save jobs', error);
  }

  // File write is async disk I/O — debounce to avoid flooding the IPC channel
  // on every keystroke or rapid state update
  if (fileWriteTimer) {
    clearTimeout(fileWriteTimer);
  }
  fileWriteTimer = setTimeout(() => {
    const success = writeJobsFile(JSON.stringify(state));
    if (!success) {
      console.warn('Unable to save jobs to file');
    }
  }, TIMING.FILE_WRITE_DEBOUNCE_MS);
};

const rootReducer = combineReducers({
  jobs: jobReducer,
  queries: queryReducer,
  bookings: bookingReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const store = createStore(rootReducer, normalizeState(loadState()) as Partial<RootState> | undefined);

let isApplyingRemote = false;
let lastSyncedAuditId: string | undefined;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let fileWriteTimer: ReturnType<typeof setTimeout> | null = null;
let syncStatus: SupabaseSyncStatus = { state: 'idle' };
let remoteLoaded = false;

const getClientId = () => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  const existing = window.localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
  if (existing) {
    return existing;
  }
  const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(STORAGE_KEYS.CLIENT_ID, next);
  return next;
};

const clientId = getClientId();
let syncStarted = false;

const getArchiveCandidates = () => {
  const now = Date.now();
  const cutoff = now - TIMING.ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return store
    .getState()
    .jobs
    .jobs.filter((job) => {
      if (job.isArchived) {
        return false;
      }
      // Archive deleted jobs after 2 months
      if (job.isDeleted && job.deletedAt) {
        return Date.parse(job.deletedAt) <= cutoff;
      }
      // Archive only if fully paid AND completed for 2+ months
      if (job.status === 'complete' && job.completedAt) {
        const total = job.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        const paid = job.totalPaid ?? 0;
        const isFullyPaid = total <= 0 || paid >= total;
        return isFullyPaid && Date.parse(job.completedAt) <= cutoff;
      }
      return false;
    })
    .map((job) => job.id);
};

const runArchiveSweep = () => {
  const candidates = getArchiveCandidates();
  if (!candidates.length) {
    return;
  }
  store.dispatch(archiveJobs(candidates, new Date().toISOString()));
};

const applyRemoteJobs = (jobs: Job[]) => {
  const current = store.getState().jobs.jobs;
  const currentById = new Map(current.map((job) => [job.id, job]));
  const merged = jobs.map((job) => {
    const existing = currentById.get(job.id);
    if (!existing) {
      return job;
    }
    const existingTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const incomingTime = job.updatedAt ? Date.parse(job.updatedAt) : 0;
    return existingTime > incomingTime ? existing : job;
  });
  isApplyingRemote = true;
  store.dispatch(replaceJobs(merged));
  isApplyingRemote = false;
  remoteLoaded = true;
  runArchiveSweep();
};

const applyRemoteAudit = (entries: JobAuditEntry[]) => {
  if (!entries.length) {
    return;
  }
  isApplyingRemote = true;
  const current = store.getState().jobs.audit;
  const merged = [...entries, ...current].reduce((acc, entry) => {
    if (!acc.some((existing) => existing.id === entry.id)) {
      acc.push(entry);
    }
    return acc;
  }, [] as JobAuditEntry[]);
  store.dispatch(setAudit(merged));
  isApplyingRemote = false;
};

const applyRemoteQueries = (queries: Query[]) => {
  const current = store.getState().queries.queries;
  const currentById = new Map(current.map((query) => [query.id, query]));
  const merged = queries.map((query) => {
    const existing = currentById.get(query.id);
    if (!existing) {
      return query;
    }
    const existingTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const incomingTime = query.updatedAt ? Date.parse(query.updatedAt) : 0;
    return existingTime > incomingTime ? existing : query;
  });
  isApplyingRemote = true;
  store.dispatch(replaceQueries(merged));
  isApplyingRemote = false;
};

const applyRemoteBookings = (bookings: Booking[]) => {
  const current = store.getState().bookings.bookings;
  const currentById = new Map(current.map((booking) => [booking.id, booking]));
  const merged = bookings.map((booking) => {
    const existing = currentById.get(booking.id);
    if (!existing) {
      return booking;
    }
    const existingTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const incomingTime = booking.updatedAt ? Date.parse(booking.updatedAt) : 0;
    return existingTime > incomingTime ? existing : booking;
  });
  isApplyingRemote = true;
  store.dispatch(replaceBookings(merged));
  isApplyingRemote = false;
};

const updateSyncStatus = (status: SupabaseSyncStatus) => {
  syncStatus = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase-sync-status', { detail: status }));
  }
};

const tryStartSync = async () => {
  if (syncStarted) {
    return;
  }
  if (!isSupabaseConfigured()) {
    return;
  }
  const cleanup = await startSupabaseSync({
    clientId,
    onRemoteJobs: applyRemoteJobs,
    onRemoteAudit: applyRemoteAudit,
    onRemoteQueries: applyRemoteQueries,
    onRemoteBookings: applyRemoteBookings,
    onStatus: updateSyncStatus,
  });
  if (cleanup) {
    syncStarted = true;
  }
};

tryStartSync();

if (typeof window !== 'undefined') {
  setInterval(tryStartSync, TIMING.SYNC_RETRY_INTERVAL_MS);
}

store.subscribe(() => {
  saveState(store.getState());
  if (isApplyingRemote) {
    return;
  }

  if (!remoteLoaded) {
    return;
  }

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(async () => {
    updateSyncStatus({ state: 'syncing', timestamp: new Date().toISOString() });
    const result = await pushStateToSupabase(store.getState(), clientId, lastSyncedAuditId);
    if (result.error) {
      updateSyncStatus({ state: 'error', message: result.error, timestamp: new Date().toISOString() });
      return;
    }
    lastSyncedAuditId = result.lastAuditId;
    updateSyncStatus({ state: 'success', timestamp: new Date().toISOString() });
  }, TIMING.SYNC_DEBOUNCE_MS);
});

runArchiveSweep();
if (typeof window !== 'undefined') {
  setInterval(runArchiveSweep, TIMING.ARCHIVE_CHECK_INTERVAL_MS);
}

export const triggerManualSync = async () => {
  if (isApplyingRemote) {
    return;
  }
  updateSyncStatus({ state: 'syncing', timestamp: new Date().toISOString() });
  const result = await pushStateToSupabase(store.getState(), clientId, lastSyncedAuditId);
  if (result.error) {
    updateSyncStatus({ state: 'error', message: result.error, timestamp: new Date().toISOString() });
    return;
  }
  lastSyncedAuditId = result.lastAuditId;
  updateSyncStatus({ state: 'success', timestamp: new Date().toISOString() });
};

export const triggerManualRefresh = async () => {
  updateSyncStatus({ state: 'syncing', timestamp: new Date().toISOString() });
  const result = await fetchSupabaseState();
  if (result.error) {
    updateSyncStatus({ state: 'error', message: result.error, timestamp: new Date().toISOString() });
    return;
  }
  if (result.jobs) {
    applyRemoteJobs(result.jobs);
  }
  if (result.audit) {
    applyRemoteAudit(result.audit);
  }
  if (result.queries) {
    applyRemoteQueries(result.queries);
  }
  if (result.bookings) {
    applyRemoteBookings(result.bookings);
  }
  updateSyncStatus({ state: 'success', timestamp: new Date().toISOString() });
};

export const getSyncStatus = () => syncStatus;

export default store;