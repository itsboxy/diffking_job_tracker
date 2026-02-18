import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { RootState } from '../store';
import { addBooking, updateBooking, deleteBooking } from '../store/bookingReducer';
import { Booking, Customer } from '../types';
import Toast from '../components/Toast';
import SideNav from '../components/SideNav';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number): number => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
};

const formatDateKey = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const todayKey = (): string => {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

const CalendarScreen: React.FC = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state: RootState) => state.bookings.bookings);
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const [toast, setToast] = useState<string | null>(null);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // Modal state
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formOther, setFormOther] = useState('');
  const [formQuote, setFormQuote] = useState('');

  // Customer autocomplete
  const customers = useMemo((): Customer[] => {
    const map = new Map<string, Customer>();
    for (const job of jobs) {
      const key = job.customerName.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { name: job.customerName, phoneNumber: job.phoneNumber, address: job.address });
      }
    }
    return Array.from(map.values());
  }, [jobs]);

  const handleCustomerNameChange = (value: string) => {
    setFormName(value);
    const match = customers.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
    if (match && match.phoneNumber) {
      setFormPhone(match.phoneNumber);
    }
  };

  // Next booking ID
  const nextBookingId = useMemo(() => {
    const maxId = bookings.reduce((max, b) => {
      const numericId = Number.parseInt(b.id, 10);
      if (Number.isNaN(numericId)) return max;
      return numericId > max ? numericId : max;
    }, -1);
    return String(maxId + 1);
  }, [bookings]);

  // Bookings grouped by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.isDeleted) continue;
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [bookings]);

  // Calendar grid cells
  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
    const cells: Array<{ day: number; dateKey: string } | null> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, dateKey: formatDateKey(currentYear, currentMonth, day) });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [currentYear, currentMonth]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const n = new Date();
    setCurrentMonth(n.getMonth());
    setCurrentYear(n.getFullYear());
  };

  const openAddModal = (dateKey: string) => {
    setModalDate(dateKey);
    setEditingBooking(null);
    setFormName('');
    setFormPhone('');
    setFormMake('');
    setFormModel('');
    setFormOther('');
    setFormQuote('');
  };

  const openEditModal = (booking: Booking) => {
    setModalDate(booking.date);
    setEditingBooking(booking);
    setFormName(booking.customerName);
    setFormPhone(booking.phoneNumber);
    setFormMake(booking.carMake);
    setFormModel(booking.carModel);
    setFormOther(booking.carOther || '');
    setFormQuote(booking.quote ? String(booking.quote) : '');
  };

  const closeModal = () => {
    setModalDate(null);
    setEditingBooking(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formName.trim() || !modalDate) return;

    if (editingBooking) {
      dispatch(updateBooking({
        ...editingBooking,
        customerName: formName.trim(),
        phoneNumber: formPhone.trim(),
        carMake: formMake.trim(),
        carModel: formModel.trim(),
        carOther: formOther.trim() || undefined,
        quote: Number(formQuote) || 0,
        date: modalDate,
      }));
      setToast('Booking updated!');
    } else {
      const booking: Booking = {
        id: nextBookingId,
        customerName: formName.trim(),
        phoneNumber: formPhone.trim(),
        carMake: formMake.trim(),
        carModel: formModel.trim(),
        carOther: formOther.trim() || undefined,
        quote: Number(formQuote) || 0,
        date: modalDate,
      };
      dispatch(addBooking(booking));
      setToast(`Booking #${nextBookingId} created!`);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (!editingBooking) return;
    dispatch(deleteBooking(editingBooking.id));
    setToast('Booking deleted.');
    closeModal();
  };

  const dismissToast = useCallback(() => setToast(null), []);

  const today = todayKey();

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <CalendarDays className="icon" />
                Calendar
              </h1>
              <p className="muted">Car drop-off bookings</p>
            </div>
          </header>

          <div className="calendar-header">
            <button type="button" className="secondary" onClick={goToPrevMonth}>
              <ChevronLeft className="icon" />
            </button>
            <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
            <button type="button" className="secondary" onClick={goToNextMonth}>
              <ChevronRight className="icon" />
            </button>
            <button type="button" className="secondary" onClick={goToToday}>
              Today
            </button>
          </div>

          <div className="calendar-grid">
            {WEEKDAYS.map((day) => (
              <div className="calendar-weekday" key={day}>{day}</div>
            ))}

            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <div className="calendar-day outside" key={`empty-${index}`} />;
              }

              const dayBookings = bookingsByDate.get(cell.dateKey) || [];
              const isToday = cell.dateKey === today;

              return (
                <div
                  className={`calendar-day ${isToday ? 'today' : ''}`}
                  key={cell.dateKey}
                  onClick={() => openAddModal(cell.dateKey)}
                >
                  <div className="calendar-day-number">{cell.day}</div>
                  <div className="calendar-day-bookings">
                    {dayBookings.map((b) => (
                      <div
                        className="calendar-booking-card"
                        key={b.id}
                        onClick={(e) => { e.stopPropagation(); openEditModal(b); }}
                      >
                        <span className="booking-name">{b.customerName}</span>
                        <span className="booking-phone">{b.phoneNumber}</span>
                        <span className="booking-car">
                          {b.carMake} {b.carModel}{b.carOther ? ` - ${b.carOther}` : ''}
                        </span>
                        {b.quote > 0 && <span className="booking-quote">${b.quote.toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {modalDate && (
        <div className="calendar-modal-overlay" onClick={closeModal}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3>{editingBooking ? 'Edit Booking' : 'New Booking'}</h3>
              <span className="muted">{modalDate}</span>
              <button type="button" className="calendar-modal-close" onClick={closeModal}>
                <X className="icon" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <label>
                Customer Name
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  list="booking-customer-suggestions"
                  autoComplete="off"
                  required
                  autoFocus
                />
                <datalist id="booking-customer-suggestions">
                  {customers.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </label>
              <label>
                Phone Number
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </label>
              <div className="calendar-modal-row">
                <label>
                  Car Make
                  <input
                    type="text"
                    value={formMake}
                    onChange={(e) => setFormMake(e.target.value)}
                    placeholder="e.g. Toyota"
                  />
                </label>
                <label>
                  Car Model
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. Hilux"
                  />
                </label>
              </div>
              <label>
                Other Details
                <input
                  type="text"
                  value={formOther}
                  onChange={(e) => setFormOther(e.target.value)}
                  placeholder="Colour, rego, notes (optional)"
                />
              </label>
              <label>
                Quote
                <input
                  type="number"
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                />
              </label>
              <div className="calendar-modal-actions">
                <button type="submit" className="primary">
                  <Plus className="icon" />
                  {editingBooking ? 'Save' : 'Add Booking'}
                </button>
                {editingBooking && (
                  <button type="button" className="danger" onClick={handleDelete}>
                    <Trash2 className="icon" />
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}
    </div>
  );
};

export default CalendarScreen;
