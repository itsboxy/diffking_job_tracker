import React, { useState } from 'react';
import { ClipboardPlus, Plus } from 'lucide-react';
import { Query, QueryItem } from '../types';
import { formatDateISO } from '../utils/formatters';

export type QueryDraft = Omit<Query, 'id'>;

interface QueryFormProps {
  onSubmit: (draft: QueryDraft) => void;
}

const emptyItem = (): QueryItem => ({ description: '' });
const todayISO = () => formatDateISO();

const QueryForm: React.FC<QueryFormProps> = ({ onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<QueryItem[]>([emptyItem()]);

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              description: value,
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const sanitizedItems = items.filter((item) => item.description.trim().length > 0);

    onSubmit({
      customerName,
      phoneNumber,
      description,
      items: sanitizedItems.length ? sanitizedItems : items,
      date: todayISO(),
    });

    setCustomerName('');
    setPhoneNumber('');
    setDescription('');
    setItems([emptyItem()]);
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
            onChange={(event) => setCustomerName(event.target.value)}
            required
          />
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
      </div>

      <div className="section-divider">
        <span>Query Description</span>
      </div>
      <label className="full-width">
        Query Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          required
        />
      </label>

      <div className="section-divider">
        <span>Items</span>
      </div>
      <div className="items-header">
        <h3>Items</h3>
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
              placeholder="Item Description"
              value={item.description}
              onChange={(event) => handleItemChange(index, event.target.value)}
              required
            />
            {items.length > 1 ? (
              <button type="button" className="danger" onClick={() => removeItem(index)}>
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="form-footer">
        <button type="submit" className="primary">
          <ClipboardPlus className="icon" />
          Create Query
        </button>
      </div>
    </form>
  );
};

export default QueryForm;
