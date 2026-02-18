import React, { useEffect, useState } from 'react';
import { Calendar, ClipboardPlus, FileImage, Plus, PlusCircle, Tag } from 'lucide-react';
import { Customer, Job, JobAttachment, JobCategory, JobItem, JobMeasurement } from '../types';
import { getUrgencyFromDate } from '../utils/urgency';
import { CATEGORY_LABELS, UNIT_OPTIONS } from '../constants/labels';
import { formatDateISO } from '../utils/formatters';

export type JobDraft = Omit<Job, 'id' | 'status'>;

interface JobFormProps {
  onSubmit: (draft: JobDraft) => void;
  customers?: Customer[];
}

const emptyItem = (): JobItem => ({ description: '', price: 0 });
const emptyMeasurement = (): JobMeasurement => ({ label: '', value: '', units: '' });
const todayISO = () => formatDateISO();
const sevenDaysFromNow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateISO(date);
};

const evaluateMathExpression = (expr: string): number => {
  const sanitized = expr.replace(/[^0-9+\-*.]/g, '');
  if (!sanitized) return 0;
  try {
    const tokens = sanitized.match(/(\d+\.?\d*|[+\-*])/g);
    if (!tokens) return 0;
    let result = parseFloat(tokens[0]) || 0;
    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = parseFloat(tokens[i + 1]) || 0;
      if (operator === '+') result += operand;
      else if (operator === '-') result -= operand;
      else if (operator === '*') result *= operand;
    }
    return Math.max(0, result);
  } catch {
    return 0;
  }
};

const JobForm: React.FC<JobFormProps> = ({ onSubmit, customers = [] }) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [estimatedDispatchDate, setEstimatedDispatchDate] = useState(sevenDaysFromNow());
  const [category, setCategory] = useState<JobCategory>('Repair');
  const [items, setItems] = useState<JobItem[]>([emptyItem()]);
  const [measurements, setMeasurements] = useState<JobMeasurement[]>([emptyMeasurement()]);
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalPaidInput, setTotalPaidInput] = useState<string>('');

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    const match = customers.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      if (match.phoneNumber) setPhoneNumber(match.phoneNumber);
      if (match.address) setAddress(match.address);
    }
  };

  useEffect(() => {
    if (category === 'Fabrication' && description.trim().length === 0 && !descriptionTouched) {
      setDescription('Fabrication measurements are listed below.');
    }

    if (category !== 'Fabrication') {
      setMeasurements([emptyMeasurement()]);
    }
  }, [category, description, descriptionTouched]);

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

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
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

  const addMeasurement = () => {
    setMeasurements((prev) => [...prev, emptyMeasurement()]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements((prev) => prev.filter((_, idx) => idx !== index));
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

  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const balance = total - totalPaid;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const sanitizedItems = items.filter(
      (item) => item.description.trim().length > 0 || Number(item.price) > 0
    );

    const sanitizedMeasurements = measurements.filter(
      (measurement) =>
        measurement.label.trim().length > 0 ||
        measurement.value.trim().length > 0 ||
        measurement.units.trim().length > 0
    );

    onSubmit({
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
      items: sanitizedItems,
      measurements:
        category === 'Fabrication' && sanitizedMeasurements.length
          ? sanitizedMeasurements
          : undefined,
      attachments: attachments.length ? attachments : undefined,
      totalPaid: totalPaid > 0 ? totalPaid : undefined,
    });

    setCustomerName('');
    setPhoneNumber('');
    setAddress('');
    setInvoiceNumber('');
    setQuoteNumber('');
    setDescription('');
    setDescriptionTouched(false);
    setDate(todayISO());
    setEstimatedDispatchDate(sevenDaysFromNow());
    setCategory('Repair');
    setItems([emptyItem()]);
    setMeasurements([emptyMeasurement()]);
    setAttachments([]);
    setTotalPaid(0);
    setTotalPaidInput('');
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="section-divider">
        <span>Customer Details</span>
      </div>
      <div className="form-grid">
        <label>
          Customer Name
          <input
            type="text"
            value={customerName}
            onChange={(event) => handleCustomerNameChange(event.target.value)}
            list="customer-suggestions"
            autoComplete="off"
            required
          />
          <datalist id="customer-suggestions">
            {customers.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </label>
        <label>
          Phone Number
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
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
            placeholder="Optional"
          />
        </label>
        <label>
          Quote Number
          <input
            type="text"
            value={quoteNumber}
            onChange={(event) => setQuoteNumber(event.target.value)}
            placeholder="Optional"
          />
        </label>
        <label>
          Category
          <div className="input-with-icon">
            <Tag className="icon" />
            <select value={category} onChange={(event) => setCategory(event.target.value as JobCategory)}>
              <option value="Repair">{CATEGORY_LABELS.Repair}</option>
              <option value="Fabrication">{CATEGORY_LABELS.Fabrication}</option>
              <option value="Deliveries and Dispatch">{CATEGORY_LABELS['Deliveries and Dispatch']}</option>
            </select>
          </div>
        </label>
        <label>
          Issue Date
          <div className="input-with-icon">
            <Calendar className="icon" />
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
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

      <div className="section-divider">
        <span>Job Description</span>
      </div>
      <label className={`full-width ${category === 'Fabrication' ? 'description-large' : ''}`}>
        Job Description
        <textarea
          value={description}
          onChange={(event) => {
            setDescriptionTouched(true);
            setDescription(event.target.value);
          }}
          rows={category === 'Fabrication' ? 7 : 4}
          required
        />
      </label>

      {category === 'Fabrication' ? (
        <section className="measurement-section">
          <div className="items-header">
            <h3>Measurements</h3>
            <button type="button" className="secondary" onClick={addMeasurement}>
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
                  <button type="button" className="danger" onClick={() => removeMeasurement(index)}>
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="section-divider">
        <span>Job Items & Pricing</span>
      </div>
      <div className="items-header">
        <h3>Job Items & Pricing</h3>
        <button type="button" className="secondary" onClick={addItem}>
          <Plus className="icon" />
          Add Item
        </button>
      </div>

      <div className="items-grid">
        {items.map((item, index) => (
          <div className="item-row" key={`item-${index}`}>
            <input
              type="text"
              placeholder="Item Description (optional)"
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
              <button type="button" className="danger" onClick={() => removeItem(index)}>
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="section-divider">
        <span>Attachments</span>
      </div>
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
          <p className="muted secondary-text">No images attached.</p>
        )}
      </section>

      <div className="section-divider">
        <span>Payment & Total</span>
      </div>
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
      <div className="form-footer">
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
        <button type="submit" className="primary">
          <ClipboardPlus className="icon" />
          Create Job
        </button>
      </div>
    </form>
  );
};

export default JobForm;
