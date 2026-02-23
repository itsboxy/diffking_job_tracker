import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Trash2,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { RootState } from '../store';
import { addBooking, updateBooking, deleteBooking, restoreBooking } from '../store/bookingReducer';
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

const advanceDateKey = (dateKey: string): string => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  return formatDateKey(next.getFullYear(), next.getMonth(), next.getDate());
};

// Returns 0 (Monday) … 6 (Sunday) — used to detect week row boundaries
const getDayOfWeek = (dateKey: string): number => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 6 : day - 1;
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

type BookingEntry = {
  booking: Booking;
  isContinuation: boolean;
  dayIndex: number;
  bleedLeft: boolean;  // this slot should bleed into the previous cell
  bleedRight: boolean; // this slot should bleed into the next cell
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
  const [formEndDate, setFormEndDate] = useState('');

  // Trash / recently deleted
  const [showTrash, setShowTrash] = useState(false);

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  // draggingBookingId = rescheduling the whole booking to a new start date
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  // extendingBookingId = dragging the extend handle to set endDate
  const [extendingBookingId, setExtendingBookingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  // Prevent click-to-edit firing immediately after a drag ends
  const dragJustEndedRef = useRef(false);

  // ── Rescheduling drag handlers ───────────────────────────────────────────
  const handleDragStart = (booking: Booking, e: React.DragEvent) => {
    setDraggingBookingId(booking.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', booking.id);
  };

  const handleDragEnd = () => {
    setDraggingBookingId(null);
    setDragOverDate(null);
    dragJustEndedRef.current = true;
    setTimeout(() => { dragJustEndedRef.current = false; }, 150);
  };

  // ── Extend-day drag handlers ─────────────────────────────────────────────
  const handleExtendStart = (booking: Booking, e: React.DragEvent) => {
    setExtendingBookingId(booking.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `extend:${booking.id}`);
  };

  const handleExtendEnd = () => {
    setExtendingBookingId(null);
    setDragOverDate(null);
    dragJustEndedRef.current = true;
    setTimeout(() => { dragJustEndedRef.current = false; }, 150);
  };

  // ── Day cell drag handlers ───────────────────────────────────────────────
  const handleDayDragOver = (dateKey: string, isPast: boolean, e: React.DragEvent) => {
    if (!draggingBookingId && !extendingBookingId) return;
    if (extendingBookingId) {
      // Extend: must drop on a day strictly after the booking's start date
      const booking = bookings.find((b) => b.id === extendingBookingId);
      if (!booking || dateKey <= booking.date) return;
    } else if (isPast) {
      return; // Rescheduling: no past dates
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDayDragEnter = (dateKey: string, isPast: boolean, e: React.DragEvent) => {
    if (!draggingBookingId && !extendingBookingId) return;
    if (extendingBookingId) {
      const booking = bookings.find((b) => b.id === extendingBookingId);
      if (!booking || dateKey <= booking.date) return;
    } else if (isPast) {
      return;
    }
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
    const data = e.dataTransfer.getData('text/plain');

    if (data.startsWith('extend:')) {
      // ── Extend drop ──
      const bookingId = data.replace('extend:', '');
      setExtendingBookingId(null);
      const booking = bookings.find((b) => b.id === bookingId && !b.isDeleted);
      if (!booking || dateKey <= booking.date) return;
      // Dropping on the same endDate toggles it off (back to single day)
      const newEndDate = booking.endDate === dateKey ? undefined : dateKey;
      dispatch(updateBooking({ ...booking, endDate: newEndDate }));
      setToast(
        newEndDate
          ? `"${booking.customerName}" extended to ${formatDateDisplay(dateKey)}`
          : `"${booking.customerName}" back to single day`
      );
    } else {
      // ── Reschedule drop ──
      setDraggingBookingId(null);
      if (isPast) return;
      const bookingId = data;
      const booking = bookings.find((b) => b.id === bookingId && !b.isDeleted);
      if (!booking) return;
      if (booking.date === dateKey) return; // same day — no-op
      // Clear endDate when rescheduling (user can re-extend if needed)
      dispatch(updateBooking({ ...booking, date: dateKey, endDate: undefined }));
      setToast(`"${booking.customerName}" moved to ${formatDateDisplay(dateKey)}`);
    }
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

  // Bookings grouped by date — multi-day bookings appear in every day of their range.
  // bleedLeft/bleedRight drive the continuous-card visual across adjacent cells.
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingEntry[]>();
    for (const b of bookings) {
      if (b.isDeleted) continue;
      const startKey = b.date;
      const endKey = b.endDate || b.date;
      let current = startKey;
      let dayIndex = 0;
      while (current <= endKey && dayIndex <= 31) {
        const isLastDay = current === endKey;
        const dow = getDayOfWeek(current); // 0=Mon … 6=Sun
        // bleedLeft: not the very first day AND not a Monday (week-row boundary)
        const bleedLeft = dayIndex > 0 && dow !== 0;
        // bleedRight: not the last day AND not a Sunday (week-row boundary)
        const bleedRight = !isLastDay && dow !== 6;
        const list = map.get(current) || [];
        list.push({ booking: b, isContinuation: dayIndex > 0, dayIndex, bleedLeft, bleedRight });
        map.set(current, list);
        current = advanceDateKey(current);
        dayIndex++;
      }
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
    if (isPast || draggingBookingId || extendingBookingId) return;
    setModalDate(dateKey);
    setEditingBooking(null);
    setFormName('');
    setFormPhone('');
    setFormMake('');
    setFormModel('');
    setFormOther('');
    setFormQuote('');
    setFormStatus('confirmed');
    setFormEndDate('');
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
    setFormEndDate(booking.endDate || '');
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
        endDate: formEndDate || undefined,
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
        endDate: formEndDate || undefined,
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

  // Bookings deleted within last 30 days, newest first
  const recentlyDeleted = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return bookings
      .filter((b) => b.isDeleted && b.deletedAt && Date.parse(b.deletedAt) >= cutoff)
      .sort((a, b) => Date.parse(b.deletedAt!) - Date.parse(a.deletedAt!));
  }, [bookings]);

  const handleRestore = (booking: Booking) => {
    dispatch(restoreBooking(booking.id));
    setToast(`"${booking.customerName}" restored!`);
  };

  const dismissToast = useCallback(() => setToast(null), []);

  const today = todayKey();
  const isAnyDragging = !!(draggingBookingId || extendingBookingId);
  const extendingBooking = extendingBookingId
    ? bookings.find((b) => b.id === extendingBookingId) ?? null
    : null;

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
              <p className="muted">Car drop-off bookings — drag to reschedule · drag ↔ handle to extend to next day</p>
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
            <button
              type="button"
              className={`secondary calendar-trash-btn${recentlyDeleted.length > 0 ? ' has-items' : ''}`}
              onClick={() => setShowTrash(true)}
              title="Recently deleted bookings"
            >
              <Trash2 className="icon" />
              Trash
              {recentlyDeleted.length > 0 && (
                <span className="trash-count-badge">{recentlyDeleted.length}</span>
              )}
            </button>
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
              <span key={s} className={`calendar-legend-item ${STATUS_CONFIG[s].className}`}>
                {STATUS_CONFIG[s].label}
              </span>
            ))}
            <span className="calendar-legend-hint">Drag card to reschedule · drag ↔ to extend</span>
          </div>

          {/* is-dragging disables pointer-events on booking cards, fixing drag-over hover */}
          <div className={`calendar-grid${isAnyDragging ? ' is-dragging' : ''}`}>
            {WEEKDAYS.map((day) => (
              <div className="calendar-weekday" key={day}>{day}</div>
            ))}

            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <div className="calendar-day outside" key={`empty-${index}`} />;
              }

              const dayEntries = bookingsByDate.get(cell.dateKey) || [];
              const isToday = cell.dateKey === today;
              const isPast = cell.dateKey < today;
              const isDropTarget = dragOverDate === cell.dateKey;
              // Extend target: green highlight — must be after the booking's start date
              const isExtendTarget = isDropTarget && !!extendingBooking && cell.dateKey > extendingBooking.date;
              // Reschedule target: blue highlight — not past, not extending
              const isRescheduleTarget = isDropTarget && !extendingBooking && !isPast;

              let dayClass = 'calendar-day';
              if (isToday) dayClass += ' today';
              else if (isPast) dayClass += ' past';
              if (isExtendTarget) dayClass += ' extend-over';
              else if (isRescheduleTarget) dayClass += ' drag-over';

              return (
                <div
                  className={dayClass}
                  key={cell.dateKey}
                  onClick={() => openAddModal(cell.dateKey, isPast)}
                  title={isPast ? undefined : 'Click to add booking'}
                  onDragOver={(e) => handleDayDragOver(cell.dateKey, isPast, e)}
                  onDragEnter={(e) => handleDayDragEnter(cell.dateKey, isPast, e)}
                  onDragLeave={handleDayDragLeave}
                  onDrop={(e) => handleDrop(cell.dateKey, isPast, e)}
                >
                  <div className="calendar-day-number">{cell.day}</div>
                  <div className="calendar-day-bookings">
                    {dayEntries.map(({ booking: b, isContinuation, dayIndex, bleedLeft, bleedRight }) => {
                      const status = b.status ?? 'confirmed';
                      const isDragging = draggingBookingId === b.id;
                      // Build span bleed class string (used by both start and continuation cards)
                      const spanCls = [bleedLeft ? 'span-bl' : '', bleedRight ? 'span-br' : ''].filter(Boolean).join(' ');

                      // Continuation card (day 2, 3, …) — purely a visual band, same style as start
                      if (isContinuation) {
                        return (
                          <div
                            key={`${b.id}-day${dayIndex}`}
                            className={`calendar-booking-card continuation ${STATUS_CONFIG[status].className}${spanCls ? ` ${spanCls}` : ''}${isDragging ? ' dragging' : ''}`}
                            onClick={(e) => { e.stopPropagation(); if (!dragJustEndedRef.current) openEditModal(b); }}
                            title={`${b.customerName} — Day ${dayIndex + 1}`}
                          >
                            <div className="booking-continuation-label">
                              Day {dayIndex + 1}
                            </div>
                          </div>
                        );
                      }

                      // Primary card (day 1 / start date)
                      return (
                        <div
                          className={`calendar-booking-card ${STATUS_CONFIG[status].className}${spanCls ? ` ${spanCls}` : ''}${isDragging ? ' dragging' : ''}`}
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
                          {b.endDate && (
                            <span className="booking-multiday-label">
                              until {formatDateDisplay(b.endDate)}
                            </span>
                          )}

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

                          {/* Extend handle — drag this to set endDate */}
                          {!isDragging && (
                            <div
                              className="booking-extend-handle"
                              draggable
                              onDragStart={(e) => { e.stopPropagation(); handleExtendStart(b, e); }}
                              onDragEnd={(e) => { e.stopPropagation(); handleExtendEnd(); }}
                              onClick={(e) => e.stopPropagation()}
                              title="Drag to extend this booking to another day"
                            >
                              ↔ extend
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Drop-target placeholder shown when rescheduling over an empty day */}
                    {isRescheduleTarget && dayEntries.length === 0 && (
                      <div className="booking-drop-placeholder" />
                    )}
                    {/* Extend-target placeholder */}
                    {isExtendTarget && (
                      <div className="booking-extend-placeholder" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Recently Deleted (Trash) modal ─────────────────────────────── */}
      {showTrash && (
        <div className="calendar-modal-overlay" onClick={() => setShowTrash(false)}>
          <div className="calendar-modal calendar-trash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3>
                <Trash2 className="icon" />
                Recently Deleted
              </h3>
              <span className="muted">Last 30 days</span>
              <button type="button" className="calendar-modal-close" onClick={() => setShowTrash(false)}>
                <X className="icon" />
              </button>
            </div>
            {recentlyDeleted.length === 0 ? (
              <p className="muted trash-empty">No recently deleted bookings.</p>
            ) : (
              <div className="trash-list">
                {recentlyDeleted.map((b) => (
                  <div key={b.id} className="trash-item">
                    <div className="trash-item-info">
                      <span className="trash-item-name">{b.customerName}</span>
                      <span className="trash-item-sub">
                        {b.carMake} {b.carModel}{b.carOther ? ` — ${b.carOther}` : ''} · {formatDateDisplay(b.date)}
                        {b.endDate ? ` → ${formatDateDisplay(b.endDate)}` : ''}
                      </span>
                      {b.deletedAt && (
                        <span className="trash-item-deleted-at muted">
                          Deleted {new Date(b.deletedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="secondary trash-restore-btn"
                      onClick={() => handleRestore(b)}
                      title="Restore this booking"
                    >
                      <RotateCcw size={14} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="calendar-modal-row">
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
                <label>
                  End Date <span className="muted">(multi-day)</span>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={modalDate || undefined}
                  />
                </label>
              </div>

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
