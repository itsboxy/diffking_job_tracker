/**
 * Database types for Supabase (snake_case naming convention)
 * These types match the database schema and are converted to/from
 * the application types (camelCase) when syncing with Supabase.
 */

import { Job, JobAuditEntry, JobItem, JobMeasurement, JobAttachment, PaymentRecord, Query, QueryItem, Booking } from './index';

export interface DbJob {
  id: string;
  category: string;
  customer_name: string;
  phone_number: string;
  address: string;
  invoice_number?: string;
  quote_number?: string;
  importance: string;
  description: string;
  date: string;
  estimated_dispatch_date?: string;
  items: JobItem[]; // JSONB in database
  status: string;
  measurements?: JobMeasurement[]; // JSONB in database
  attachments?: JobAttachment[]; // JSONB in database
  total_paid?: number;
  payment_history?: PaymentRecord[]; // JSONB in database
  updated_at?: string;
  completed_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  is_archived?: boolean;
  archived_at?: string;
}

export interface DbAuditEntry {
  id: string;
  job_id?: string;
  action: string;
  timestamp: string;
  summary: string;
  client_id?: string;
}

/**
 * Converts a Job object to a DbJob object (camelCase → snake_case)
 */
export const toDbJob = (job: Job): DbJob => {
  return {
    id: job.id,
    category: job.category,
    customer_name: job.customerName,
    phone_number: job.phoneNumber,
    address: job.address,
    invoice_number: job.invoiceNumber,
    quote_number: job.quoteNumber,
    importance: job.importance,
    description: job.description,
    date: job.date,
    estimated_dispatch_date: job.estimatedDispatchDate,
    items: job.items,
    status: job.status,
    measurements: job.measurements,
    attachments: job.attachments,
    total_paid: job.totalPaid,
    payment_history: job.paymentHistory,
    updated_at: job.updatedAt,
    completed_at: job.completedAt,
    is_deleted: job.isDeleted,
    deleted_at: job.deletedAt,
    is_archived: job.isArchived,
    archived_at: job.archivedAt,
  };
};

/**
 * Converts a DbJob object to a Job object (snake_case → camelCase)
 */
export const fromDbJob = (dbJob: DbJob): Job => {
  return {
    id: dbJob.id,
    category: dbJob.category as Job['category'],
    customerName: dbJob.customer_name,
    phoneNumber: dbJob.phone_number,
    address: dbJob.address,
    invoiceNumber: dbJob.invoice_number,
    quoteNumber: dbJob.quote_number,
    importance: dbJob.importance as Job['importance'],
    description: dbJob.description,
    date: dbJob.date,
    estimatedDispatchDate: dbJob.estimated_dispatch_date,
    items: dbJob.items,
    status: dbJob.status as Job['status'],
    measurements: dbJob.measurements,
    attachments: dbJob.attachments,
    totalPaid: dbJob.total_paid,
    paymentHistory: dbJob.payment_history,
    updatedAt: dbJob.updated_at,
    completedAt: dbJob.completed_at,
    isDeleted: dbJob.is_deleted,
    deletedAt: dbJob.deleted_at,
    isArchived: dbJob.is_archived,
    archivedAt: dbJob.archived_at,
  };
};

/**
 * Converts a JobAuditEntry object to a DbAuditEntry object (camelCase → snake_case)
 */
export const toDbAuditEntry = (entry: JobAuditEntry): DbAuditEntry => {
  return {
    id: entry.id,
    job_id: entry.jobId,
    action: entry.action,
    timestamp: entry.timestamp,
    summary: entry.summary,
    client_id: entry.client_id,
  };
};

/**
 * Converts a DbAuditEntry object to a JobAuditEntry object (snake_case → camelCase)
 */
export const fromDbAuditEntry = (dbEntry: DbAuditEntry): JobAuditEntry => {
  return {
    id: dbEntry.id,
    jobId: dbEntry.job_id,
    action: dbEntry.action as JobAuditEntry['action'],
    timestamp: dbEntry.timestamp,
    summary: dbEntry.summary,
    client_id: dbEntry.client_id,
  };
};

export interface DbQuery {
  id: string;
  customer_name: string;
  phone_number: string;
  description: string;
  items: QueryItem[]; // JSONB in database
  date: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

/**
 * Converts a Query object to a DbQuery object (camelCase → snake_case)
 */
export const toDbQuery = (query: Query): DbQuery => {
  return {
    id: query.id,
    customer_name: query.customerName,
    phone_number: query.phoneNumber,
    description: query.description,
    items: query.items,
    date: query.date,
    updated_at: query.updatedAt,
    is_deleted: query.isDeleted,
    deleted_at: query.deletedAt,
  };
};

/**
 * Converts a DbQuery object to a Query object (snake_case → camelCase)
 */
export const fromDbQuery = (dbQuery: DbQuery): Query => {
  return {
    id: dbQuery.id,
    customerName: dbQuery.customer_name,
    phoneNumber: dbQuery.phone_number,
    description: dbQuery.description,
    items: dbQuery.items,
    date: dbQuery.date,
    updatedAt: dbQuery.updated_at,
    isDeleted: dbQuery.is_deleted,
    deletedAt: dbQuery.deleted_at,
  };
};

export interface DbBooking {
  id: string;
  customer_name: string;
  phone_number: string;
  car_make: string;
  car_model: string;
  car_other?: string;
  quote: number;
  date: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

export const toDbBooking = (booking: Booking): DbBooking => {
  return {
    id: booking.id,
    customer_name: booking.customerName,
    phone_number: booking.phoneNumber,
    car_make: booking.carMake,
    car_model: booking.carModel,
    car_other: booking.carOther,
    quote: booking.quote,
    date: booking.date,
    updated_at: booking.updatedAt,
    is_deleted: booking.isDeleted,
    deleted_at: booking.deletedAt,
  };
};

export const fromDbBooking = (dbBooking: DbBooking): Booking => {
  return {
    id: dbBooking.id,
    customerName: dbBooking.customer_name,
    phoneNumber: dbBooking.phone_number,
    carMake: dbBooking.car_make,
    carModel: dbBooking.car_model,
    carOther: dbBooking.car_other,
    quote: dbBooking.quote,
    date: dbBooking.date,
    updatedAt: dbBooking.updated_at,
    isDeleted: dbBooking.is_deleted,
    deletedAt: dbBooking.deleted_at,
  };
};
