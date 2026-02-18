import { Job, JobAuditEntry, JobStatus } from '../types';

export interface JobState {
  jobs: Job[];
  audit: JobAuditEntry[];
}

const initialState: JobState = {
  jobs: [],
  audit: [],
};

const ADD_JOB = 'ADD_JOB';
const UPDATE_JOB_STATUS = 'UPDATE_JOB_STATUS';
const DELETE_JOB = 'DELETE_JOB';
const RESTORE_JOB = 'RESTORE_JOB';
const CLEAR_JOBS = 'CLEAR_JOBS';
const UPDATE_JOB = 'UPDATE_JOB';
const SET_JOBS = 'SET_JOBS';
const REPLACE_JOBS = 'REPLACE_JOBS';
const SET_AUDIT = 'SET_AUDIT';
const ARCHIVE_JOBS = 'ARCHIVE_JOBS';

interface AddJobAction {
  type: typeof ADD_JOB;
  payload: Job;
}

interface UpdateJobStatusAction {
  type: typeof UPDATE_JOB_STATUS;
  payload: {
    id: string;
    status: JobStatus;
  };
}

interface UpdateJobAction {
  type: typeof UPDATE_JOB;
  payload: Job;
}

interface DeleteJobAction {
  type: typeof DELETE_JOB;
  payload: {
    id: string;
    deletedAt: string;
  };
}

interface RestoreJobAction {
  type: typeof RESTORE_JOB;
  payload: {
    id: string;
  };
}

interface ClearJobsAction {
  type: typeof CLEAR_JOBS;
}

interface SetJobsAction {
  type: typeof SET_JOBS;
  payload: Job[];
}

interface ReplaceJobsAction {
  type: typeof REPLACE_JOBS;
  payload: Job[];
}

interface SetAuditAction {
  type: typeof SET_AUDIT;
  payload: JobAuditEntry[];
}

interface ArchiveJobsAction {
  type: typeof ARCHIVE_JOBS;
  payload: {
    ids: string[];
    archivedAt: string;
  };
}

export type JobAction =
  | AddJobAction
  | UpdateJobStatusAction
  | DeleteJobAction
  | RestoreJobAction
  | ClearJobsAction
  | UpdateJobAction
  | SetJobsAction
  | ReplaceJobsAction
  | SetAuditAction
  | ArchiveJobsAction;

export const addJob = (job: Job): AddJobAction => ({
  type: ADD_JOB,
  payload: job,
});

export const updateJobStatus = (id: string, status: JobStatus): UpdateJobStatusAction => ({
  type: UPDATE_JOB_STATUS,
  payload: { id, status },
});

export const updateJob = (job: Job): UpdateJobAction => ({
  type: UPDATE_JOB,
  payload: job,
});

export const setJobs = (jobs: Job[]): SetJobsAction => ({
  type: SET_JOBS,
  payload: jobs,
});

export const replaceJobs = (jobs: Job[]): ReplaceJobsAction => ({
  type: REPLACE_JOBS,
  payload: jobs,
});

export const setAudit = (audit: JobAuditEntry[]): SetAuditAction => ({
  type: SET_AUDIT,
  payload: audit,
});

export const archiveJobs = (ids: string[], archivedAt: string): ArchiveJobsAction => ({
  type: ARCHIVE_JOBS,
  payload: { ids, archivedAt },
});

const createAudit = (entry: Omit<JobAuditEntry, 'id' | 'timestamp'>): JobAuditEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toISOString(),
  ...entry,
});

const withUpdatedAt = <T extends Job>(job: T): T => ({
  ...job,
  updatedAt: new Date().toISOString(),
});

export const deleteJob = (id: string): DeleteJobAction => ({
  type: DELETE_JOB,
  payload: { id, deletedAt: new Date().toISOString() },
});

export const restoreJob = (id: string): RestoreJobAction => ({
  type: RESTORE_JOB,
  payload: { id },
});

export const clearJobs = (): ClearJobsAction => ({
  type: CLEAR_JOBS,
});

const jobReducer = (state = initialState, action: JobAction): JobState => {
  switch (action.type) {
    case ADD_JOB:
      return {
        ...state,
        jobs: [withUpdatedAt(action.payload), ...state.jobs],
        audit: [
          createAudit({
            action: 'JOB_CREATED',
            jobId: action.payload.id,
            summary: `Job ${action.payload.id} created for ${action.payload.customerName}.`,
          }),
          ...state.audit,
        ],
      };
    case UPDATE_JOB_STATUS:
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id
            ? withUpdatedAt({
                ...job,
                status: action.payload.status,
                completedAt:
                  action.payload.status === 'complete'
                    ? new Date().toISOString()
                    : undefined,
              })
            : job
        ),
        audit: [
          createAudit({
            action: 'STATUS_UPDATED',
            jobId: action.payload.id,
            summary: `Job ${action.payload.id} status set to ${action.payload.status}.`,
          }),
          ...state.audit,
        ],
      };
    case UPDATE_JOB:
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id ? withUpdatedAt({ ...job, ...action.payload }) : job
        ),
        audit: [
          createAudit({
            action: 'JOB_UPDATED',
            jobId: action.payload.id,
            summary: `Job ${action.payload.id} updated.`,
          }),
          ...state.audit,
        ],
      };
    case DELETE_JOB:
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id
            ? withUpdatedAt({ ...job, isDeleted: true, deletedAt: action.payload.deletedAt })
            : job
        ),
        audit: [
          createAudit({
            action: 'JOB_DELETED',
            jobId: action.payload.id,
            summary: `Job ${action.payload.id} deleted.`,
          }),
          ...state.audit,
        ],
      };
    case RESTORE_JOB:
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id
            ? withUpdatedAt({
                ...job,
                isDeleted: false,
                deletedAt: undefined,
                isArchived: false,
                archivedAt: undefined,
                completedAt: job.completedAt ? new Date().toISOString() : undefined,
              })
            : job
        ),
        audit: [
          createAudit({
            action: 'JOB_RESTORED',
            jobId: action.payload.id,
            summary: `Job ${action.payload.id} restored.`,
          }),
          ...state.audit,
        ],
      };
    case CLEAR_JOBS:
      return {
        ...state,
        jobs: [],
        audit: [
          createAudit({
            action: 'JOBS_CLEARED',
            summary: 'All jobs cleared from the board.',
          }),
          ...state.audit,
        ],
      };
    case SET_JOBS:
      return {
        ...state,
        jobs: action.payload.map((job) => ({
          ...job,
          updatedAt: job.updatedAt || new Date().toISOString(),
          completedAt: job.completedAt,
          archivedAt: job.archivedAt,
          isArchived: job.isArchived || false,
        })),
        audit: [
          createAudit({
            action: 'JOBS_IMPORTED',
            summary: `Imported ${action.payload.length} jobs.`,
          }),
          ...state.audit,
        ],
      };
    case REPLACE_JOBS:
      return {
        ...state,
        jobs: action.payload,
      };
    case ARCHIVE_JOBS:
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          action.payload.ids.includes(job.id)
            ? {
                ...job,
                isArchived: true,
                archivedAt: action.payload.archivedAt,
              }
            : job
        ),
        audit: [
          createAudit({
            action: 'JOBS_CLEARED',
            summary: `Archived ${action.payload.ids.length} jobs after retention window.`,
          }),
          ...state.audit,
        ],
      };
    case SET_AUDIT:
      return {
        ...state,
        audit: action.payload,
      };
    default:
      return state;
  }
};

export default jobReducer;
