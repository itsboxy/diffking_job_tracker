export type JobStatus =
    | 'complete'
    | 'in progress'
    | 'not started'
    | 'awaiting parts'
    | 'powdercoaters';

export type JobCategory = 'Repair' | 'Fabrication' | 'Deliveries and Dispatch';

export type JobImportance = 'Low' | 'Medium' | 'High' | 'Urgent';

export type AuditAction =
    | 'JOB_CREATED'
    | 'JOB_UPDATED'
    | 'STATUS_UPDATED'
    | 'JOB_DELETED'
    | 'JOB_RESTORED'
    | 'JOBS_CLEARED'
    | 'JOBS_IMPORTED';

export interface JobItem {
    description: string;
    price: number;
}

export interface JobMeasurement {
    label: string;
    value: string;
    units: string;
}

export interface JobAttachment {
    name: string;
    dataUrl: string;
}

export interface PaymentRecord {
    amount: number;
    date: string;
}

export interface Job {
    id: string;
    category: JobCategory;
    customerName: string;
    phoneNumber: string;
    address: string;
    invoiceNumber?: string;
    quoteNumber?: string;
    importance: JobImportance;
    description: string;
    date: string;
    estimatedDispatchDate?: string;
    items: JobItem[];
    status: JobStatus;
    measurements?: JobMeasurement[];
    attachments?: JobAttachment[];
    totalPaid?: number;
    paymentHistory?: PaymentRecord[];
    updatedAt?: string;
    completedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
    isArchived?: boolean;
    archivedAt?: string;
}

export interface JobAuditEntry {
    id: string;
    jobId?: string;
    action: AuditAction;
    timestamp: string;
    summary: string;
    client_id?: string;
}

export interface Customer {
    name: string;
    phoneNumber: string;
    address: string;
}

export interface QueryItem {
    description: string;
}

export interface Query {
    id: string;
    customerName: string;
    phoneNumber: string;
    description: string;
    items: QueryItem[];
    date: string;
    updatedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

export type BookingStatus = 'confirmed' | 'completed' | 'no-show' | 'cancelled';

export interface Booking {
    id: string;
    customerName: string;
    phoneNumber: string;
    carMake: string;
    carModel: string;
    carOther?: string;
    quote: number;
    date: string;
    status?: BookingStatus;
    updatedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}