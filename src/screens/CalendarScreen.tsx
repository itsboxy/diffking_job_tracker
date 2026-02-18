import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { RootState } from '../store';
import { addBooking, updateBooking, deleteBooking } from '../store/bookingReducer';
import { Booking, BookingStatus, Customer } from '../types';
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

const formatDateDisplay = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'status-confirmed' },
  completed: { label: 'Completed', className: 'status-completed' },
  'no-show': { label: 'No Show', className: 'status-no-show' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
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
  const [formStatus, setFormStatus] = useState<BookingStatus>('confirmed');

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  // Prevent click-to-edit firing immediately after a drag ends
  const dragJustEndedRef = useRef(false);

  const handleDragStart = (booking: Booking, e: React.DragEvent) => {
    setDraggingBookingId(booking.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', booking.id);
  };

  const handleDragEnd = () => {
    setDraggingBookingId(null);
    setDragOverDate(null);
    // Suppress the next click so drag-end doesn't open the edit modal
    dragJustEndedRef.current = true;
    setTimeout(() => { dragJustEndedRef.current = false; }, 150);
  };

  const handleDayDragOver = (isPast: boolean, e: React.DragEvent) => {
    if (isPast || !draggingBookingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDayDragEnter = (dateKey: string, isPast: boolean, e: React.DragEvent) => {
    if (isPast || !draggingBookingId) return;
    e.preventDefault();
    setDragOverDate(dateKey);
  };

  const handleDayDragLeave = (e: React.DragEvent) => {
    // Only clear when truly leaving the cell (not entering a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (dateKey: string, isPast: boolean, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
    setDraggingBookingId(null);
    if (isPast) return;

    const bookingId = e.dataTransfer.getData('text/plain');
    const booking = bookings.find((b) => b.id === bookingId && !b.isDeleted);
    if (!booking) return;
    if (booking.date === dateKey) return; // dropped on same day — no-op

    dispatch(updateBooking({ ...booking, date: dateKey }));
    setToast(`"${booking.customerName}" moved to ${formatDateDisplay(dateKey)}`);
  };
  // ────────────────────────────────────────────────────────────────────────

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

  const openAddModal = (dateKey: string, isPast: boolean) => {
    if (isPast || draggingBookingId) return;
    setModalDate(dateKey);
    setEditingBooking(null);
    setFormName('');
    setFormPhone('');
    setFormMake('');
    setFormModel('');
    setFormOther('');
    setFormQuote('');
    setFormStatus('confirmed');
  };

  const openEditModal = (booking: Booking) => {
    if (dragJustEndedRef.current) return;
    setModalDate(booking.date);
    setEditingBooking(booking);
    setFormName(booking.customerName);
    setFormPhone(booking.phoneNumber);
    setFormMake(booking.carMake);
    setFormModel(booking.carModel);
    setFormOther(booking.carOther || '');
    setFormQuote(booking.quote ? String(booking.quote) : '');
    setFormStatus(booking.status ?? 'confirmed');
  };

  const closeModal = () => {
    setModalDate(null);
    setEditingBooking(null);
  };

  // Quick-set status directly from booking card without opening full modal
  const handleQuickStatus = (booking: Booking, status: BookingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(updateBooking({ ...booking, status }));
    setToast(`Marked as ${STATUS_CONFIG[status].label}`);
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
        status: formStatus,
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
        status: formStatus,
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
              <p className="muted">Car drop-off bookings — drag to reschedule</p>
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

          {/* Legend */}
          <div className="calendar-legend">
            {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
              <span key={s} className={`calendar-legend-item ${STATUS_CONFIG[s].className}`}>
                {STATUS_CONFIG[s].label}
              </span>
            ))}
            <span className="calendar-legend-hint">Drag a booking to reschedule it</span>
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
              const isPast = cell.dateKey < today;
              const isDropTarget = dragOverDate === cell.dateKey && !isPast;

              let dayClass = 'calendar-day';
              if (isToday) dayClass += ' today';
              else if (isPast) dayClass += ' past';
              if (isDropTarget) dayClass += ' drag-over';

              return (
                <div
                  className={dayClass}
                  key={cell.dateKey}
                  onClick={() => openAddModal(cell.dateKey, isPast)}
                  title={isPast ? undefined : 'Click to add booking'}
                  onDragOver={(e) => handleDayDragOver(isPast, e)}
                  onDragEnter={(e) => handleDayDragEnter(cell.dateKey, isPast, e)}
                  onDragLeave={handleDayDragLeave}
                  onDrop={(e) => handleDrop(cell.dateKey, isPast, e)}
                >
                  <div className="calendar-day-number">{cell.day}</div>
                  <div className="calendar-day-bookings">
                    {dayBookings.map((b) => {
                      const status = b.status ?? 'confirmed';
                      const isDragging = draggingBookingId === b.id;
                      return (
                        <div
                          className={`calendar-booking-card ${STATUS_CONFIG[status].className}${isDragging ? ' dragging' : ''}`}
                          key={b.id}
                          draggable
                          onDragStart={(e) => handleDragStart(b, e)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => { e.stopPropagation(); openEditModal(b); }}
                        >
                          <div className="booking-card-top">
                            <span className="booking-name">{b.customerName}</span>
                            <span className={`booking-status-badge ${STATUS_CONFIG[status].className}`}>
                              {STATUS_CONFIG[status].label}
                            </span>
                          </div>
                          <span className="booking-phone">{b.phoneNumber}</span>
                          <span className="booking-car">
                            {b.carMake} {b.carModel}{b.carOther ? ` — ${b.carOther}` : ''}
                          </span>
                          {b.quote > 0 && <span className="booking-quote">${b.quote.toFixed(2)}</span>}
                          {/* Quick-action status buttons (hidden while dragging) */}
                          {!isDragging && status !== 'completed' && status !== 'cancelled' && (
                            <div className="booking-quick-actions">
                              <button
                                type="button"
                                className="quick-action-btn completed"
                                title="Mark Completed"
                                onClick={(e) => handleQuickStatus(b, 'completed', e)}
                              >
                                <CheckCircle2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="quick-action-btn no-show"
                                title="Mark No Show"
                                onClick={(e) => handleQuickStatus(b, 'no-show', e)}
                              >
                                <UserX size={12} />
                              </button>
                              <button
                                type="button"
                                className="quick-action-btn cancelled"
                                title="Cancel Booking"
                                onClick={(e) => handleQuickStatus(b, 'cancelled', e)}
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Drop-target placeholder shown when dragging over an empty day */}
                    {isDropTarget && dayBookings.length === 0 && (
                      <div className="booking-drop-placeholder" />
                    )}
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

              {/* Status selector */}
              <div>
                <span className="calendar-modal-status-label">Status</span>
                <div className="calendar-modal-status-group">
                  {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`status-btn ${STATUS_CONFIG[s].className} ${formStatus === s ? 'active' : ''}`}
                      onClick={() => setFormStatus(s)}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="calendar-modal-actions">
                <button type="submit" className="primary">
                  <Plus className="icon" />
                  {editingBooking ? 'Save Changes' : 'Add Booking'}
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
