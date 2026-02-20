import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  FileImage,
  Pencil,
  Plus,
  PlusCircle,
  Save,
  Tag,
  X,
} from 'lucide-react';
import { Job, JobAttachment, JobCategory, JobItem, JobMeasurement } from '../types';
import { getUrgencyFromDate } from '../utils/urgency';
import { CATEGORY_LABELS, UNIT_OPTIONS } from '../constants/labels';

interface JobEditModalProps {
  job: Job;
  onCancel: () => void;
  onSave: (job: Job) => void;
}

const emptyItem = (): JobItem => ({ description: '', price: 0 });
const emptyMeasurement = (): JobMeasurement => ({ label: '', value: '', units: '' });

const evaluateMathExpression = (expr: string): number => {
  const sanitized = expr.replace(/[^0-9+\-*.]/g, '');
  if (!sanitized) return 0;
  try {
    const tokens = sanitized.match(/(\d+\.?\d*|[+\-*])/g);
    if (!tokens) return 0;

    // Separate into parallel arrays of numbers and operators
    const nums: number[] = [];
    const ops: string[] = [];
    for (const token of tokens) {
      if (token === '+' || token === '-' || token === '*') {
        ops.push(token);
      } else {
        nums.push(parseFloat(token) || 0);
      }
    }

    // Pass 1: handle multiplication (higher precedence)
    let i = 0;
    while (i < ops.length) {
      if (ops[i] === '*') {
        nums.splice(i, 2, nums[i] * nums[i + 1]);
        ops.splice(i, 1);
      } else {
        i++;
      }
    }

    // Pass 2: handle addition and subtraction left-to-right
    let result = nums[0] ?? 0;
    for (let j = 0; j < ops.length; j++) {
      if (ops[j] === '+') result += nums[j + 1];
      else if (ops[j] === '-') result -= nums[j + 1];
    }

    return Math.max(0, result);
  } catch {
    return 0;
  }
};

const JobEditModal: React.FC<JobEditModalProps> = ({ job, onCancel, onSave }) => {
  const [customerName, setCustomerName] = useState(job.customerName);
  const [phoneNumber, setPhoneNumber] = useState(job.phoneNumber);
  const [address, setAddress] = useState(job.address);
  const [invoiceNumber, setInvoiceNumber] = useState(job.invoiceNumber ?? '');
  const [quoteNumber, setQuoteNumber] = useState(job.quoteNumber ?? '');
  const [description, setDescription] = useState(job.description);
  const [date, setDate] = useState(job.date);
  const [estimatedDispatchDate, setEstimatedDispatchDate] = useState(
    job.estimatedDispatchDate ?? ''
  );
  const [category, setCategory] = useState<JobCategory>(job.category);
  const [items, setItems] = useState<JobItem[]>(job.items.length ? job.items : [emptyItem()]);
  const [measurements, setMeasurements] = useState<JobMeasurement[]>(
    job.measurements?.length ? job.measurements : [emptyMeasurement()]
  );
  const [attachments, setAttachments] = useState<JobAttachment[]>(job.attachments ?? []);
  const [totalPaid, setTotalPaid] = useState<number>(job.totalPaid ?? 0);
  const [totalPaidInput, setTotalPaidInput] = useState<string>(
    job.totalPaid ? job.totalPaid.toFixed(2) : ''
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [items]
  );

  const balance = total - totalPaid;

  useEffect(() => {
    if (category !== 'Fabrication') {
      setMeasurements([emptyMeasurement()]);
    }
  }, [category]);

  const handleItemChange = (index: number, field: keyof JobItem, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: field === 'price' ? (value === '' ? 0 : Number(value)) : value,
            }
          : item
      )
    );
  };

  const handleMeasurementChange = (
    index: number,
    field: keyof JobMeasurement,
    value: string
  ) => {
    setMeasurements((prev) =>
      prev.map((measurement, idx) =>
        idx === index
          ? {
              ...measurement,
              [field]: value,
            }
          : measurement
      )
    );
  };

  const handleSave = () => {
    const sanitizedItems = items.filter(
      (item) => item.description.trim().length > 0 || Number(item.price) > 0
    );
    const sanitizedMeasurements = measurements.filter(
      (measurement) =>
        measurement.label.trim().length > 0 ||
        measurement.value.trim().length > 0 ||
        measurement.units.trim().length > 0
    );

    onSave({
      ...job,
      customerName,
      phoneNumber,
      address,
      invoiceNumber: invoiceNumber.trim() || undefined,
      quoteNumber: quoteNumber.trim() || undefined,
      importance: getUrgencyFromDate(estimatedDispatchDate || date),
      description,
      date,
      estimatedDispatchDate: estimatedDispatchDate || undefined,
      category,
      items: sanitizedItems.length ? sanitizedItems : items,
      measurements:
        category === 'Fabrication'
          ? sanitizedMeasurements.length
            ? sanitizedMeasurements
            : measurements
          : undefined,
      attachments: attachments.length ? attachments : undefined,
      totalPaid: totalPaid > 0 ? totalPaid : undefined,
    });
  };

  const handleAddAttachments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const fileReads = files.map(
      (file) =>
        new Promise<JobAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
          reader.onerror = () => reject(new Error('Unable to read file'));
          reader.readAsDataURL(file);
        })
    );

    try {
      const nextAttachments = await Promise.all(fileReads);
      setAttachments((prev) => [...prev, ...nextAttachments]);
    } catch (error) {
      // ignore file errors
    }

    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>
            <Pencil className="icon" />
            Edit Job {job.id}
          </h2>
          <button type="button" className="secondary" onClick={onCancel}>
            <X className="icon" />
            Close
          </button>
        </div>

        <div className="modal-body">
          <div className="section-divider"><span>Customer Details</span></div>
          <div className="form-grid">
            <label>
              Customer Name
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>
            <label>
              Phone Number
              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
            <label>
              Invoice Number
              <input
                type="text"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
              />
            </label>
            <label>
              Quote Number
              <input
                type="text"
                value={quoteNumber}
                onChange={(event) => setQuoteNumber(event.target.value)}
              />
            </label>
            <label>
              Category
              <div className="input-with-icon">
                <Tag className="icon" />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as JobCategory)}
                >
                  <option value="Repair">{CATEGORY_LABELS.Repair}</option>
                  <option value="Fabrication">{CATEGORY_LABELS.Fabrication}</option>
                  <option value="Deliveries and Dispatch">
                    {CATEGORY_LABELS['Deliveries and Dispatch']}
                  </option>
                </select>
              </div>
            </label>
            <label>
              Issue Date
              <div className="input-with-icon">
                <Calendar className="icon" />
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            </label>
            <label>
              Estimated Dispatch Date
              <div className="input-with-icon">
                <Calendar className="icon" />
                <input
                  type="date"
                  value={estimatedDispatchDate}
                  onChange={(event) => setEstimatedDispatchDate(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </label>
          </div>

          <div className="section-divider"><span>Job Description</span></div>
          <label className={`full-width ${category === 'Fabrication' ? 'description-large' : ''}`}>
            Job Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={category === 'Fabrication' ? 7 : 4}
            />
          </label>

          {category === 'Fabrication' ? (
            <>
            <div className="section-divider"><span>Measurements</span></div>
            <section className="measurement-section">
              <div className="items-header">
                <h3>Measurements</h3>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setMeasurements((prev) => [...prev, emptyMeasurement()])}
                >
                  <PlusCircle className="icon" />
                  Add Measurement
                </button>
              </div>

              <div className="measurement-grid">
                {measurements.map((measurement, index) => (
                  <div className="measurement-row" key={`measurement-${index}`}>
                    <input
                      type="text"
                      placeholder="Part / Label"
                      value={measurement.label}
                      onChange={(event) => handleMeasurementChange(index, 'label', event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={measurement.value}
                      onChange={(event) => handleMeasurementChange(index, 'value', event.target.value)}
                    />
                    <select
                      value={measurement.units}
                      onChange={(event) => handleMeasurementChange(index, 'units', event.target.value)}
                    >
                      <option value="">Units</option>
                      {UNIT_OPTIONS
                        .filter((option) => option)
                        .map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                    {measurements.length > 1 ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => setMeasurements((prev) => prev.filter((_, idx) => idx !== index))}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
            </>
          ) : null}

          <div className="section-divider"><span>Job Items & Pricing</span></div>
          <div className="items-header">
            <h3>Job Items & Pricing</h3>
            <button type="button" className="secondary" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              <Plus className="icon" />
              Add Item
            </button>
          </div>

          <div className="items-grid">
            {items.map((item, index) => (
              <div className="item-row" key={`item-${index}`}>
                <input
                  type="text"
                  placeholder="Item Description"
                  value={item.description}
                  onChange={(event) => handleItemChange(index, 'description', event.target.value)}
                />
                <input
                  type="number"
                  placeholder="Price"
                  min={0}
                  step="0.01"
                  value={item.price ? item.price : ''}
                  onChange={(event) => handleItemChange(index, 'price', event.target.value)}
                />
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="section-divider"><span>Attachments</span></div>
          <section className="attachments-section">
            <div className="items-header">
              <h3>Attachments</h3>
              <label className="secondary">
                <FileImage className="icon" />
                Add Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddAttachments}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {attachments.length ? (
              <div className="attachments-grid">
                {attachments.map((file, index) => (
                  <div className="attachment-card" key={`attachment-${index}`}>
                    <img src={file.dataUrl} alt={file.name} className="attachment-thumb" />
                    <div className="attachment-meta">
                      <span>{file.name}</span>
                      <button type="button" className="danger" onClick={() => removeAttachment(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No images attached.</p>
            )}
          </section>

          <div className="section-divider"><span>Payment</span></div>
          <div className="form-grid">
            <label>
              Amount Paid
              <input
                type="text"
                placeholder="0.00 (e.g., 1000+200)"
                value={totalPaidInput}
                onChange={(event) => setTotalPaidInput(event.target.value)}
                onBlur={() => {
                  const evaluated = evaluateMathExpression(totalPaidInput);
                  setTotalPaid(evaluated);
                  setTotalPaidInput(evaluated ? evaluated.toFixed(2) : '');
                }}
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <div className="total">
            <span>Total Estimate</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          {totalPaid > 0 && (
            <div className="total">
              <span>Amount Paid</span>
              <strong>${totalPaid.toFixed(2)}</strong>
            </div>
          )}
          {totalPaid > 0 && (
            <div className="total">
              <span>{balance <= 0 ? 'FULLY PAID' : 'Balance Due'}</span>
              <strong style={{ color: balance <= 0 ? '#10B981' : '#EF4444' }}>
                ${Math.abs(balance).toFixed(2)}
              </strong>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              <X className="icon" />
              Cancel
            </button>
            <button type="button" className="primary" onClick={handleSave}>
              <Save className="icon" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobEditModal;
