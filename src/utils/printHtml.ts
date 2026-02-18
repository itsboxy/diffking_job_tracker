import { Job } from '../types';
import { getUrgencyFromDate, formatDueLabel } from './urgency';
import { formatStatus } from './formatters';

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateJobPrintHtml = (job: Job, logoDataUrl?: string): string => {
  const total = job.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalPaid = job.totalPaid || 0;
  const balance = total - totalPaid;
  const isPaidInFull = balance <= 0 && totalPaid > 0;
  const dueDate = job.estimatedDispatchDate || job.date;
  const urgency = getUrgencyFromDate(dueDate);
  const dueLabel = formatDueLabel(dueDate);

  const getUrgencyColor = (urg: string) => {
    switch (urg.toLowerCase()) {
      case 'urgent': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '#EF4444' };
      case 'high': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '#F59E0B' };
      case 'medium': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '#3B82F6' };
      default: return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '#10B981' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '#10B981' };
      case 'in progress': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '#F59E0B' };
      case 'awaiting parts': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '#3B82F6' };
      case 'powdercoaters': return { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '#2563EB' };
      default: return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '#EF4444' };
    }
  };

  const urgencyColors = getUrgencyColor(urgency);
  const statusColors = getStatusColor(job.status);

  const itemsHtml = job.items
    .map(
      (item) => `
        <div class="item-row">
          <span class="item-desc">${escapeHtml(item.description)}</span>
          <span class="item-price">$${Number(item.price || 0).toFixed(2)}</span>
        </div>
      `
    )
    .join('');

  const measurementsHtml = job.measurements?.length
    ? job.measurements
        .map(
          (measurement) => `
            <div class="measurement-row">
              <span class="measurement-label">${escapeHtml(measurement.label)}</span>
              <span class="measurement-value">${escapeHtml(measurement.value)} ${escapeHtml(measurement.units)}</span>
            </div>
          `
        )
        .join('')
    : '';

  const attachmentsHtml = job.attachments?.length
    ? job.attachments
        .map(
          (file) => `
            <div class="attachment-card">
              <img src="${escapeHtml(file.dataUrl)}" alt="${escapeHtml(file.name)}" />
              <span class="attachment-name">${escapeHtml(file.name)}</span>
            </div>
          `
        )
        .join('')
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Job ${escapeHtml(job.id)} - ${escapeHtml(job.customerName)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            color: #1A1A1A;
            padding: 16px;
            background: #FAFAFA;
            line-height: 1.4;
            font-size: 13px;
            -webkit-font-smoothing: antialiased;
          }

          .print-container {
            max-width: 800px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid #E5E7EB;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 18px;
            background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
            color: white;
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .logo-icon {
            width: 38px;
            height: 38px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-text {
            display: flex;
            flex-direction: column;
          }

          .logo-text span {
            font-weight: 800;
            font-size: 16px;
            letter-spacing: 0.02em;
          }

          .logo-text small {
            font-size: 11px;
            opacity: 0.9;
            font-weight: 500;
          }

          .badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .badge {
            padding: 5px 12px;
            border-radius: 14px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border: 1px solid;
          }

          .badge-category {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
          }

          .badge-status {
            background: ${statusColors.bg};
            color: ${statusColors.color};
            border-color: ${statusColors.border};
          }

          .badge-paid {
            background: rgba(16, 185, 129, 0.15);
            color: #10B981;
            border-color: #10B981;
          }

          /* Customer Info Card */
          .customer-card {
            padding: 14px 18px;
            border-bottom: 1px solid #E5E7EB;
          }

          .customer-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }

          .customer-name {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: #1A1A1A;
            margin-bottom: 2px;
          }

          .job-id {
            font-size: 12px;
            color: #737373;
            font-weight: 600;
          }

          .urgency-badge {
            padding: 5px 12px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            background: ${urgencyColors.bg};
            color: ${urgencyColors.color};
            border: 1px solid ${urgencyColors.border};
          }

          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .meta-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #737373;
          }

          .meta-value {
            font-size: 12px;
            font-weight: 600;
            color: #1A1A1A;
          }

          /* Sections */
          .section {
            padding: 12px 18px;
            border-bottom: 1px solid #E5E7EB;
          }

          .section:last-child {
            border-bottom: none;
          }

          .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #737373;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #E5E7EB;
          }

          /* Description */
          .description-box {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 10px 12px;
          }

          .description-text {
            font-size: 12px;
            line-height: 1.6;
            color: #525252;
            white-space: pre-wrap;
          }

          /* Items */
          .items-list {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
          }

          .item-desc {
            font-size: 12px;
            font-weight: 500;
            color: #1A1A1A;
          }

          .item-price {
            font-size: 12px;
            font-weight: 700;
            color: #1A1A1A;
          }

          /* Totals */
          .totals-box {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 10px 12px;
            margin-top: 10px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
          }

          .total-row:not(:last-child) {
            border-bottom: 1px solid #E5E7EB;
          }

          .total-label {
            font-size: 12px;
            font-weight: 600;
            color: #525252;
          }

          .total-value {
            font-size: 13px;
            font-weight: 700;
            color: #1A1A1A;
          }

          .total-row.highlight {
            padding-top: 8px;
            margin-top: 4px;
            border-top: 1px solid #D1D5DB;
          }

          .total-row.highlight .total-label {
            font-size: 13px;
            font-weight: 800;
          }

          .total-row.highlight .total-value {
            font-size: 18px;
            font-weight: 800;
          }

          .paid { color: #10B981 !important; }
          .unpaid { color: #EF4444 !important; }

          /* Measurements */
          .measurement-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            margin-bottom: 5px;
          }

          .measurement-label {
            font-size: 12px;
            font-weight: 500;
            color: #1A1A1A;
          }

          .measurement-value {
            font-size: 12px;
            font-weight: 700;
            color: #2563EB;
          }

          /* Attachments */
          .attachments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
          }

          .attachment-card {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 6px;
            text-align: center;
          }

          .attachment-card img {
            width: 100%;
            height: 70px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 5px;
          }

          .attachment-name {
            font-size: 10px;
            color: #737373;
            font-weight: 500;
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Print Actions */
          .print-actions {
            position: fixed;
            top: 12px;
            right: 12px;
            display: flex;
            gap: 6px;
            z-index: 999;
          }

          .print-btn {
            border: none;
            background: #2563EB;
            color: #FFFFFF;
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            font-family: inherit;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
            transition: all 0.2s;
          }

          .print-btn:hover {
            background: #1D4ED8;
            transform: translateY(-1px);
          }

          /* Print Styles */
          @media print {
            body {
              padding: 10px;
              background: white;
              font-size: 12px;
            }
            .print-container {
              box-shadow: none;
              border: none;
              border-radius: 0;
            }
            .print-actions {
              display: none;
            }
            .header {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 10px 14px;
            }
            .customer-card, .section {
              padding: 10px 14px;
            }
            .badge, .urgency-badge, .totals-box, .item-row, .measurement-row, .description-box {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button class="print-btn" onclick="window.print()">🖨️ Print</button>
        </div>

        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              ${
                logoDataUrl
                  ? `<img src="${escapeHtml(logoDataUrl)}" alt="Logo" width="38" height="38" style="border-radius: 10px;" />`
                  : `
                <div class="logo-icon">
                  <svg width="22" height="22" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 18h12c9 0 16 6 16 14s-7 14-16 14H18V18zm12 8h-4v12h4c4.6 0 8-2.6 8-6s-3.4-6-8-6z" fill="#fff" />
                  </svg>
                </div>
              `
              }
              <div class="logo-text">
                <span>DIFF KING</span>
                <small>Job Tracker</small>
              </div>
            </div>
            <div class="badges">
              <span class="badge badge-category">${escapeHtml(job.category)}</span>
              <span class="badge badge-status">${escapeHtml(formatStatus(job.status))}</span>
              ${isPaidInFull ? '<span class="badge badge-paid">FULLY PAID</span>' : ''}
            </div>
          </div>

          <!-- Customer Info -->
          <div class="customer-card">
            <div class="customer-header">
              <div>
                <h1 class="customer-name">${escapeHtml(job.customerName)}</h1>
                <p class="job-id">Job #${escapeHtml(job.id)}</p>
              </div>
              <span class="urgency-badge">${escapeHtml(urgency)}</span>
            </div>
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Phone</span>
                <span class="meta-value">${escapeHtml(job.phoneNumber)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Address</span>
                <span class="meta-value">${escapeHtml(job.address || 'N/A')}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Issue Date</span>
                <span class="meta-value">${escapeHtml(job.date)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Due Date</span>
                <span class="meta-value">${escapeHtml(dueLabel)}</span>
              </div>
              ${job.invoiceNumber ? `
              <div class="meta-item">
                <span class="meta-label">Invoice #</span>
                <span class="meta-value">${escapeHtml(job.invoiceNumber)}</span>
              </div>
              ` : ''}
              ${job.quoteNumber ? `
              <div class="meta-item">
                <span class="meta-label">Quote #</span>
                <span class="meta-value">${escapeHtml(job.quoteNumber)}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Description -->
          <div class="section">
            <h3 class="section-title">Job Description</h3>
            <div class="description-box">
              <p class="description-text">${escapeHtml(job.description)}</p>
            </div>
          </div>

          <!-- Items -->
          <div class="section">
            <h3 class="section-title">Items & Pricing</h3>
            <div class="items-list">
              ${itemsHtml}
            </div>
            <div class="totals-box">
              <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-value">$${total.toFixed(2)}</span>
              </div>
              ${totalPaid > 0 ? `
              <div class="total-row">
                <span class="total-label">Amount Paid</span>
                <span class="total-value paid">$${totalPaid.toFixed(2)}</span>
              </div>
              <div class="total-row highlight">
                <span class="total-label ${isPaidInFull ? 'paid' : 'unpaid'}">${isPaidInFull ? 'FULLY PAID' : 'Balance Due'}</span>
                <span class="total-value ${isPaidInFull ? 'paid' : 'unpaid'}">$${Math.abs(balance).toFixed(2)}</span>
              </div>
              ` : `
              <div class="total-row highlight">
                <span class="total-label">Total Due</span>
                <span class="total-value">$${total.toFixed(2)}</span>
              </div>
              `}
            </div>
          </div>

          ${measurementsHtml ? `
          <!-- Measurements -->
          <div class="section">
            <h3 class="section-title">Measurements</h3>
            ${measurementsHtml}
          </div>
          ` : ''}

          ${attachmentsHtml ? `
          <!-- Attachments -->
          <div class="section">
            <h3 class="section-title">Attachments</h3>
            <div class="attachments-grid">
              ${attachmentsHtml}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
};
