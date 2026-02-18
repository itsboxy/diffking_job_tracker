import { RootState } from './index';
import { Job, JobAuditEntry, Query, Booking } from '../types';
import { DbJob, DbAuditEntry, DbQuery, DbBooking } from '../types/database';
import { getSupabaseClient } from '../supabaseClient';
import { DB_TABLES, TIMING } from '../constants/config';

const fromDbJob = (row: DbJob | Record<string, unknown>): Job => {
  const r = row as Record<string, unknown>;
  return {
    id: (r.id ?? '') as string,
    category: (r.category ?? 'Repair') as Job['category'],
    customerName: (r.customerName ?? r.customer_name ?? r.customername ?? '') as string,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? r.phonenumber ?? '') as string,
    address: (r.address ?? '') as string,
    invoiceNumber: (r.invoiceNumber ?? r.invoice_number ?? r.invoicenumber ?? undefined) as string | undefined,
    quoteNumber: (r.quoteNumber ?? r.quote_number ?? r.quotenumber ?? undefined) as string | undefined,
    importance: (r.importance ?? 'Medium') as Job['importance'],
    description: (r.description ?? '') as string,
    date: (r.date ?? '') as string,
    items: (r.items ?? []) as Job['items'],
    status: (r.status ?? 'not started') as Job['status'],
    measurements: (r.measurements ?? undefined) as Job['measurements'],
    attachments: (r.attachments ?? undefined) as Job['attachments'],
    totalPaid: (r.totalPaid ?? r.total_paid ?? r.totalpaid ?? undefined) as number | undefined,
    paymentHistory: (r.paymentHistory ?? r.payment_history ?? r.paymenthistory ?? undefined) as Job['paymentHistory'],
    updatedAt: (r.updated_at ?? r.updatedAt ?? r.updatedat ?? undefined) as string | undefined,
    completedAt: (r.completed_at ?? r.completedAt ?? r.completedat ?? undefined) as string | undefined,
    isDeleted: (r.isDeleted ?? r.is_deleted ?? r.isdeleted ?? false) as boolean,
    deletedAt: (r.deletedAt ?? r.deleted_at ?? r.deletedat ?? undefined) as string | undefined,
    estimatedDispatchDate: (r.estimated_dispatch_date ?? r.estimatedDispatchDate ?? r.estimateddispatchdate ?? undefined) as string | undefined,
    isArchived: (r.isArchived ?? r.is_archived ?? r.isarchived ?? false) as boolean,
    archivedAt: (r.archived_at ?? r.archivedAt ?? r.archivedat ?? undefined) as string | undefined,
  };
};

const toDbJob = (job: Job) => ({
  id: job.id,
  category: job.category,
  customer_name: job.customerName,
  phone_number: job.phoneNumber,
  address: job.address,
  invoice_number: job.invoiceNumber ?? null,
  quote_number: job.quoteNumber ?? null,
  importance: job.importance,
  description: job.description,
  date: job.date,
  items: job.items,
  status: job.status,
  measurements: job.measurements ?? null,
  attachments: job.attachments ?? null,
  total_paid: job.totalPaid ?? null,
  payment_history: job.paymentHistory ?? null,
  updated_at: job.updatedAt ?? null,
  completed_at: job.completedAt ?? null,
  is_deleted: job.isDeleted ?? false,
  deleted_at: job.deletedAt ?? null,
  estimated_dispatch_date: job.estimatedDispatchDate ?? null,
  is_archived: job.isArchived ?? false,
  archived_at: job.archivedAt ?? null,
});

const fromDbAudit = (row: DbAuditEntry | Record<string, unknown>): JobAuditEntry => {
  const r = row as Record<string, unknown>;
  return {
    id: (r.id ?? '') as string,
    jobId: (r.jobId ?? r.job_id ?? r.jobid ?? undefined) as string | undefined,
    action: (r.action ?? 'JOB_UPDATED') as JobAuditEntry['action'],
    timestamp: (r.timestamp ?? '') as string,
    summary: (r.summary ?? '') as string,
    client_id: (r.client_id ?? r.clientId ?? r.clientid ?? undefined) as string | undefined,
  };
};

const toDbAudit = (entry: JobAuditEntry, clientId: string) => ({
  id: entry.id,
  job_id: entry.jobId ?? null,
  action: entry.action,
  timestamp: entry.timestamp,
  summary: entry.summary,
  client_id: entry.client_id ?? clientId,
});

const fromDbQuery = (row: DbQuery | Record<string, unknown>): Query => {
  const r = row as Record<string, unknown>;
  return {
    id: (r.id ?? '') as string,
    customerName: (r.customerName ?? r.customer_name ?? r.customername ?? '') as string,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? r.phonenumber ?? '') as string,
    description: (r.description ?? '') as string,
    items: (r.items ?? []) as Query['items'],
    date: (r.date ?? '') as string,
    updatedAt: (r.updated_at ?? r.updatedAt ?? r.updatedat ?? undefined) as string | undefined,
    isDeleted: (r.isDeleted ?? r.is_deleted ?? r.isdeleted ?? false) as boolean,
    deletedAt: (r.deletedAt ?? r.deleted_at ?? r.deletedat ?? undefined) as string | undefined,
  };
};

const toDbQuery = (query: Query) => ({
  id: query.id,
  customer_name: query.customerName,
  phone_number: query.phoneNumber,
  description: query.description,
  items: query.items,
  date: query.date,
  updated_at: query.updatedAt ?? null,
  is_deleted: query.isDeleted ?? false,
  deleted_at: query.deletedAt ?? null,
});

const fromDbBooking = (row: DbBooking | Record<string, unknown>): Booking => {
  const r = row as Record<string, unknown>;
  return {
    id: (r.id ?? '') as string,
    customerName: (r.customerName ?? r.customer_name ?? r.customername ?? '') as string,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? r.phonenumber ?? '') as string,
    carMake: (r.carMake ?? r.car_make ?? r.carmake ?? '') as string,
    carModel: (r.carModel ?? r.car_model ?? r.carmodel ?? '') as string,
    carOther: (r.carOther ?? r.car_other ?? r.carother ?? undefined) as string | undefined,
    quote: (r.quote ?? 0) as number,
    date: (r.date ?? '') as string,
    updatedAt: (r.updated_at ?? r.updatedAt ?? r.updatedat ?? undefined) as string | undefined,
    isDeleted: (r.isDeleted ?? r.is_deleted ?? r.isdeleted ?? false) as boolean,
    deletedAt: (r.deletedAt ?? r.deleted_at ?? r.deletedat ?? undefined) as string | undefined,
  };
};

const toDbBooking = (booking: Booking) => ({
  id: booking.id,
  customer_name: booking.customerName,
  phone_number: booking.phoneNumber,
  car_make: booking.carMake,
  car_model: booking.carModel,
  car_other: booking.carOther ?? null,
  quote: booking.quote,
  date: booking.date,
  updated_at: booking.updatedAt ?? null,
  is_deleted: booking.isDeleted ?? false,
  deleted_at: booking.deletedAt ?? null,
});

export interface SupabaseSyncOptions {
  clientId: string;
  onRemoteJobs: (jobs: Job[]) => void;
  onRemoteAudit: (audit: JobAuditEntry[]) => void;
  onRemoteQueries: (queries: Query[]) => void;
  onRemoteBookings: (bookings: Booking[]) => void;
  onStatus?: (status: SupabaseSyncStatus) => void;
}

export interface SupabaseSyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  timestamp?: string;
}

export const fetchSupabaseState = async (): Promise<{
  jobs?: Job[];
  audit?: JobAuditEntry[];
  queries?: Query[];
  bookings?: Booking[];
  error?: string;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'Supabase client not configured.' };
  }

  const { data: jobs, error: jobsError } = await client.from(DB_TABLES.JOBS).select('*');
  if (jobsError) {
    return { error: jobsError.message };
  }

  const { data: audit, error: auditError } = await client
    .from(DB_TABLES.AUDIT)
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(TIMING.AUDIT_LIMIT);
  if (auditError) {
    return { error: auditError.message };
  }

  const { data: queries, error: queriesError } = await client.from(DB_TABLES.QUERIES).select('*');
  if (queriesError) {
    return { error: queriesError.message };
  }

  const { data: bookings, error: bookingsError } = await client.from(DB_TABLES.BOOKINGS).select('*');
  if (bookingsError) {
    return { error: bookingsError.message };
  }

  return {
    jobs: (jobs as Array<DbJob | Record<string, unknown>>).map(fromDbJob),
    audit: (audit as Array<DbAuditEntry | Record<string, unknown>>).map(fromDbAudit),
    queries: (queries as Array<DbQuery | Record<string, unknown>>).map(fromDbQuery),
    bookings: (bookings as Array<DbBooking | Record<string, unknown>>).map(fromDbBooking),
  };
};

export const startSupabaseSync = async (options: SupabaseSyncOptions) => {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  options.onStatus?.({ state: 'syncing', timestamp: new Date().toISOString() });

  const { data: jobs, error: jobsError } = await client.from(DB_TABLES.JOBS).select('*');
  if (jobsError) {
    options.onStatus?.({ state: 'error', message: jobsError.message, timestamp: new Date().toISOString() });
  } else if (jobs) {
    options.onRemoteJobs((jobs as Array<DbJob | Record<string, unknown>>).map(fromDbJob));
  }

  const { data: audit, error: auditError } = await client
    .from(DB_TABLES.AUDIT)
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(TIMING.AUDIT_LIMIT);
  if (auditError) {
    options.onStatus?.({ state: 'error', message: auditError.message, timestamp: new Date().toISOString() });
  } else if (audit) {
    options.onRemoteAudit((audit as Array<DbAuditEntry | Record<string, unknown>>).map(fromDbAudit));
  }

  const { data: queries, error: queriesError } = await client.from(DB_TABLES.QUERIES).select('*');
  if (queriesError) {
    options.onStatus?.({ state: 'error', message: queriesError.message, timestamp: new Date().toISOString() });
  } else if (queries) {
    options.onRemoteQueries((queries as Array<DbQuery | Record<string, unknown>>).map(fromDbQuery));
  }

  const { data: bookings, error: bookingsError } = await client.from(DB_TABLES.BOOKINGS).select('*');
  if (bookingsError) {
    options.onStatus?.({ state: 'error', message: bookingsError.message, timestamp: new Date().toISOString() });
  } else if (bookings) {
    options.onRemoteBookings((bookings as Array<DbBooking | Record<string, unknown>>).map(fromDbBooking));
  }

  options.onStatus?.({ state: 'success', timestamp: new Date().toISOString() });

  const jobsChannel = client
    .channel('jobs_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DB_TABLES.JOBS },
      async () => {
        const { data: nextJobs } = await client.from(DB_TABLES.JOBS).select('*');
        if (nextJobs) {
          options.onRemoteJobs((nextJobs as Array<DbJob | Record<string, unknown>>).map(fromDbJob));
        }
      }
    )
    .subscribe();

  const auditChannel = client
    .channel('job_audit_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: DB_TABLES.AUDIT },
      (payload) => {
        const entry = fromDbAudit(payload.new);
        if (entry?.client_id && entry.client_id === options.clientId) {
          return;
        }
        options.onRemoteAudit([entry]);
      }
    )
    .subscribe();

  const queriesChannel = client
    .channel('queries_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DB_TABLES.QUERIES },
      async () => {
        const { data: nextQueries } = await client.from(DB_TABLES.QUERIES).select('*');
        if (nextQueries) {
          options.onRemoteQueries((nextQueries as Array<DbQuery | Record<string, unknown>>).map(fromDbQuery));
        }
      }
    )
    .subscribe();

  const bookingsChannel = client
    .channel('bookings_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DB_TABLES.BOOKINGS },
      async () => {
        const { data: nextBookings } = await client.from(DB_TABLES.BOOKINGS).select('*');
        if (nextBookings) {
          options.onRemoteBookings((nextBookings as Array<DbBooking | Record<string, unknown>>).map(fromDbBooking));
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(jobsChannel);
    client.removeChannel(auditChannel);
    client.removeChannel(queriesChannel);
    client.removeChannel(bookingsChannel);
  };
};

export const pushStateToSupabase = async (
  state: RootState,
  clientId: string,
  lastAuditId?: string
): Promise<{ lastAuditId?: string; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { lastAuditId };
  }

  const jobs = state.jobs.jobs.map((job) => toDbJob(job));
  const audit = state.jobs.audit;
  const queries = state.queries.queries.map((query) => toDbQuery(query));

  const { error: jobsError } = await client
    .from(DB_TABLES.JOBS)
    .upsert(jobs, { onConflict: 'id' });

  if (jobsError) {
    return { lastAuditId, error: jobsError.message };
  }

  const { error: queriesError } = await client
    .from(DB_TABLES.QUERIES)
    .upsert(queries, { onConflict: 'id' });

  if (queriesError) {
    return { lastAuditId, error: queriesError.message };
  }

  const bookings = (state.bookings?.bookings ?? []).map((b) => toDbBooking(b));
  const { error: bookingsError } = await client
    .from(DB_TABLES.BOOKINGS)
    .upsert(bookings, { onConflict: 'id' });

  if (bookingsError) {
    return { lastAuditId, error: bookingsError.message };
  }

  let newAuditEntries = audit;
  if (lastAuditId) {
    const index = audit.findIndex((entry) => entry.id === lastAuditId);
    if (index >= 0) {
      newAuditEntries = audit.slice(0, index);
    }
  }

  const pendingAudit = newAuditEntries
    .filter((entry) => !entry.client_id || entry.client_id === clientId)
    .map((entry) => toDbAudit(entry, clientId));

  if (pendingAudit.length) {
    const { error: auditError } = await client.from(DB_TABLES.AUDIT).upsert(pendingAudit, { onConflict: 'id' });
    if (auditError) {
      return { lastAuditId, error: auditError.message };
    }
  }

  return { lastAuditId: audit[0]?.id ?? lastAuditId };
};
