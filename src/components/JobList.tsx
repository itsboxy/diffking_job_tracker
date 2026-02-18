import React, { useState } from 'react';
import {
  Archive,
  DollarSign,
  FileDown,
  MoreHorizontal,
  Pencil,
  Printer,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { Job, JobStatus as Status } from '../types';
import JobStatus from './JobStatus';
import { formatDueLabel, getUrgencyFromDate } from '../utils/urgency';
import { CATEGORY_LABELS } from '../constants/labels';
import { formatStatus } from '../utils/formatters';

interface JobListProps {
  jobs: Job[];
  onStatusChange: (id: string, status: Status) => void;
  onSavePdf?: (job: Job) => void;
  onPrint?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onRestore?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onSendToDispatch?: (job: Job) => void;
  onArchive?: (job: Job) => void;
  onAddPayment?: (job: Job, amount: number) => void;
  selectedJobIds?: Set<string>;
  onToggleSelect?: (jobId: string) => void;
  hideUrgency?: boolean;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  onStatusChange,
  onPrint,
  onSavePdf,
  onDelete,
  onRestore,
  onEdit,
  onSendToDispatch,
  onArchive,
  onAddPayment,
  selectedJobIds,
  onToggleSelect,
  hideUrgency,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const [paymentModalJob, setPaymentModalJob] = useState<Job | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  if (!jobs.length) {
    return <p className="empty-state">No jobs for this category yet.</p>;
  }

  const toggleExpanded = (jobId: string) => {
    setExpandedId((current) => (current === jobId ? null : jobId));
  };

  return (
    <div className="job-list">
      {jobs.map((job) => (
        (() => {
          const isExpanded = expandedId === job.id;
          const hasActions = Boolean(
            onEdit || onPrint || onSavePdf || onDelete || onRestore || onSendToDispatch || onArchive
          );
          const dueDate = job.estimatedDispatchDate || job.date;
          const urgency = getUrgencyFromDate(dueDate);
          const dueLabel = formatDueLabel(dueDate);
          const jobTotal = job.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
          const jobPaid = job.totalPaid || 0;
          const jobBalance = jobTotal - jobPaid;
          const isJobPaidInFull = jobBalance <= 0 && jobPaid > 0;
          return (
        <article
          className={`job-card ${isExpanded ? 'expanded' : 'collapsed'}`}
          key={job.id}
          onClick={() => toggleExpanded(job.id)}
        >
          <header className="job-card-header">
            <div>
              <h3>{job.customerName}</h3>
              <p className="job-phone">{job.phoneNumber}</p>
            </div>
            <div className="job-card-meta">
              <label className="select-toggle" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedJobIds?.has(job.id) ?? false}
                  onChange={() => onToggleSelect?.(job.id)}
                />
                <span>Select</span>
              </label>
              {isJobPaidInFull && (
                <span className="status-pill complete">FULLY PAID</span>
              )}
              {jobPaid > 0 && !isJobPaidInFull && (
                <span className="status-pill in-progress">PARTIAL PAID</span>
              )}
              {!hideUrgency && (
                job.status === 'complete' && !isJobPaidInFull ? (
                  <span className="importance-pill awaiting-payment">
                    Awaiting Payment
                  </span>
                ) : (
                  <span className={`importance-pill ${urgency.toLowerCase()}`}>
                    {urgency}
                  </span>
                )
              )}
              <span className={`status-pill ${job.status.replace(' ', '-')}`}>
                {formatStatus(job.status)}
              </span>
            </div>
          </header>
          {isExpanded ? (
            <>
              <section className="job-card-body">
                <div className="section-divider">
                  <span>Job Summary</span>
                </div>
                <p className="job-description">{job.description}</p>
                <div className="section-divider">
                  <span>Job Details</span>
                </div>
                <div className="job-meta">
                  <div>
                    <span className="label">Job ID</span>
                    <span>{job.id}</span>
                  </div>
                  <div>
                    <span className="label">Category</span>
                    <span>{CATEGORY_LABELS[job.category]}</span>
                  </div>
                  <div>
                    <span className="label">Urgency</span>
                    <span>{urgency}</span>
                  </div>
                  <div>
                    <span className="label">Phone</span>
                    <span>{job.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="label">Address</span>
                    <span>{job.address}</span>
                  </div>
                  <div>
                    <span className="label">Issue Date</span>
                    <span>{job.date}</span>
                  </div>
                  <div>
                    <span className="label">Due</span>
                    <span className={`due-date-badge ${urgency.toLowerCase()}`}>{dueLabel}</span>
                  </div>
                </div>

                <div className="job-highlight">
                  {job.invoiceNumber ? (
                    <div className="invoice-highlight">
                      <span className="label">Invoice</span>
                      <strong>{job.invoiceNumber}</strong>
                    </div>
                  ) : null}
                  {job.quoteNumber ? (
                    <div className="quote-highlight">
                      <span className="label">Quote</span>
                      <strong>{job.quoteNumber}</strong>
                    </div>
                  ) : null}
                </div>

                <div className="job-items">
                  <div className="section-divider">
                    <span>Items</span>
                  </div>
                  <h4>Items</h4>
                  <ul>
                    {job.items.map((item, index) => (
                      <li key={`${job.id}-item-${index}`}>
                        <span>{item.description}</span>
                        <strong>${item.price.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                  {(() => {
                    const total = job.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                    const totalPaid = job.totalPaid || 0;
                    const balance = total - totalPaid;
                    const isPaidInFull = balance <= 0 && totalPaid > 0;
                    return (
                      <>
                        <div className="job-subtotal">
                          <span>Estimated Total</span>
                          <strong>${total.toFixed(2)}</strong>
                        </div>
                        {totalPaid > 0 && (
                          <>
                            <div className="job-subtotal" style={{ marginTop: '8px' }}>
                              <span>Amount Paid</span>
                              <strong style={{ color: '#10B981' }}>${totalPaid.toFixed(2)}</strong>
                            </div>
                            <div className="job-subtotal" style={{ marginTop: '8px', borderTop: '2px solid var(--border-medium)' }}>
                              <span style={{ fontWeight: 700, color: isPaidInFull ? '#10B981' : '#EF4444' }}>
                                {isPaidInFull ? 'FULLY PAID' : 'Balance Due'}
                              </span>
                              <strong style={{ color: isPaidInFull ? '#10B981' : '#EF4444', fontSize: '20px' }}>
                                ${Math.abs(balance).toFixed(2)}
                              </strong>
                            </div>
                          </>
                        )}
                        {job.paymentHistory && job.paymentHistory.length > 0 && (
                          <div className="payment-history" style={{ marginTop: '16px' }}>
                            <div className="section-divider">
                              <span>Payment History</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {job.paymentHistory.map((payment, idx) => (
                                <li key={`payment-${idx}`} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '10px 16px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{payment.date}</span>
                                  <strong style={{ color: '#10B981' }}>${payment.amount.toFixed(2)}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {job.measurements && job.measurements.length ? (
                  <div className="job-measurements">
                    <div className="section-divider">
                      <span>Measurements</span>
                    </div>
                    <h4>Measurements</h4>
                    <ul>
                      {job.measurements.map((measurement, index) => (
                        <li key={`${job.id}-measurement-${index}`}>
                          <span>{measurement.label}</span>
                          <strong>
                            {measurement.value}
                            {measurement.units ? ` ${measurement.units}` : ''}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {job.attachments && job.attachments.length ? (
                  <div className="job-attachments" onClick={(event) => event.stopPropagation()}>
                    <div className="section-divider">
                      <span>Attachments</span>
                    </div>
                    <h4>Attachments</h4>
                    <div className="attachments-grid">
                      {job.attachments.map((file, index) => (
                        <button
                          key={`${job.id}-attachment-${index}`}
                          type="button"
                          className="attachment-card"
                          onClick={() => setPreviewImage({ src: file.dataUrl, name: file.name })}
                        >
                          <img src={file.dataUrl} alt={file.name} className="attachment-thumb" />
                          <span className="attachment-name">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <footer className="job-card-footer" onClick={(event) => event.stopPropagation()}>
                <div className="job-card-actions">
                  <JobStatus jobId={job.id} status={job.status} onChange={onStatusChange} />
                  {onAddPayment ? (
                    <button
                      type="button"
                      className="secondary add-payment-btn"
                      onClick={() => {
                        setPaymentModalJob(job);
                      }}
                    >
                      <DollarSign className="icon" />
                      Payment
                    </button>
                  ) : null}
                  {hasActions ? (
                    <div className="menu-wrapper">
                      <button
                        type="button"
                        className="menu-trigger"
                        onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                        aria-label="Job actions"
                      >
                        <MoreHorizontal className="icon" />
                      </button>
                      {openMenuId === job.id ? (
                        <div className="menu-panel" onClick={(event) => event.stopPropagation()}>
                          {onEdit ? (
                            <button type="button" onClick={() => { setOpenMenuId(null); onEdit(job); }}>
                              <Pencil className="icon" />
                              Edit
                            </button>
                          ) : null}
                          {onSendToDispatch && job.category !== 'Deliveries and Dispatch' ? (
                            <button type="button" onClick={() => { setOpenMenuId(null); onSendToDispatch(job); }}>
                              <Send className="icon" />
                              Send to Dispatch
                            </button>
                          ) : null}
                          {onPrint ? (
                            <button type="button" onClick={() => { setOpenMenuId(null); onPrint(job); }}>
                              <Printer className="icon" />
                              Print
                            </button>
                          ) : null}
                          {onSavePdf ? (
                            <button type="button" onClick={() => { setOpenMenuId(null); onSavePdf(job); }}>
                              <FileDown className="icon" />
                              Save PDF
                            </button>
                          ) : null}
                          {onArchive && !job.isDeleted && !job.isArchived ? (
                            <button type="button" onClick={() => { setOpenMenuId(null); onArchive(job); }}>
                              <Archive className="icon" />
                              Send to Archive
                            </button>
                          ) : null}
                          {job.isDeleted || job.isArchived ? (
                            onRestore ? (
                              <button type="button" onClick={() => { setOpenMenuId(null); onRestore(job); }}>
                                <RotateCcw className="icon" />
                                Restore
                              </button>
                            ) : null
                          ) : onDelete ? (
                            <button type="button" className="danger" onClick={() => { setOpenMenuId(null); onDelete(job); }}>
                              <Trash2 className="icon" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </footer>
            </>
          ) : null}
        </article>
          );
        })()
      ))}
      {previewImage ? (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewImage.name}</h3>
              <button type="button" className="secondary" onClick={() => setPreviewImage(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <img src={previewImage.src} alt={previewImage.name} className="preview-image" />
            </div>
          </div>
        </div>
      ) : null}
      {paymentModalJob ? (
        <div className="modal-backdrop" onClick={() => { setPaymentModalJob(null); setPaymentAmount(''); }}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                <DollarSign className="icon" />
                Add Payment
              </h3>
              <button type="button" className="secondary" onClick={() => { setPaymentModalJob(null); setPaymentAmount(''); }}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                <strong>Customer:</strong> {paymentModalJob.customerName}<br />
                <strong>Job ID:</strong> {paymentModalJob.id}
              </p>
              {(() => {
                const total = paymentModalJob.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                const paid = paymentModalJob.totalPaid || 0;
                const balance = total - paid;
                return (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div className="total">
                      <span>Total</span>
                      <strong>${total.toFixed(2)}</strong>
                    </div>
                    <div className="total">
                      <span>Paid</span>
                      <strong style={{ color: '#10B981' }}>${paid.toFixed(2)}</strong>
                    </div>
                    <div className="total">
                      <span>Balance</span>
                      <strong style={{ color: balance > 0 ? '#EF4444' : '#10B981' }}>${balance.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })()}
              <label>
                Payment Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  autoFocus
                />
              </label>
              {paymentModalJob.paymentHistory && paymentModalJob.paymentHistory.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Payment History</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paymentModalJob.paymentHistory.map((payment, idx) => (
                      <li key={`modal-payment-${idx}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{payment.date}</span>
                        <strong style={{ color: '#10B981' }}>${payment.amount.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="secondary" onClick={() => { setPaymentModalJob(null); setPaymentAmount(''); }}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const amount = parseFloat(paymentAmount);
                  if (amount > 0 && onAddPayment) {
                    onAddPayment(paymentModalJob, amount);
                    setPaymentModalJob(null);
                    setPaymentAmount('');
                  }
                }}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                <DollarSign className="icon" />
                Add Payment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default JobList;
