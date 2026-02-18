import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { HelpCircle, Search, Phone, User, MessageSquare, PlusCircle, Trash2 as TrashIcon, List } from 'lucide-react';
import { addQuery, deleteQuery } from '../store/queryReducer';
import { addJob } from '../store/jobReducer';
import { Query, Job, JobCategory, JobItem, Customer } from '../types';
import QueryList from '../components/QueryList';
import Toast from '../components/Toast';
import { RootState } from '../store';
import SideNav from '../components/SideNav';
import { formatDateISO } from '../utils/formatters';

const QueriesScreen: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const queries = useSelector((state: RootState) => state.queries.queries);
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Quick-add form state
  const [qaName, setQaName] = useState('');
  const [qaPhone, setQaPhone] = useState('');
  const [qaNote, setQaNote] = useState('');

  const activeQueries = queries.filter((query) => !query.isDeleted);
  const deletedQueries = queries.filter((query) => query.isDeleted);

  // Customer autocomplete from existing jobs and queries
  const customers = useMemo((): Customer[] => {
    const map = new Map<string, Customer>();
    for (const job of jobs) {
      const key = job.customerName.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, {
          name: job.customerName,
          phoneNumber: job.phoneNumber,
          address: job.address,
        });
      }
    }
    for (const query of queries) {
      const key = query.customerName.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, {
          name: query.customerName,
          phoneNumber: query.phoneNumber,
          address: '',
        });
      }
    }
    return Array.from(map.values());
  }, [jobs, queries]);

  const handleCustomerNameChange = (value: string) => {
    setQaName(value);
    const match = customers.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match && match.phoneNumber) {
      setQaPhone(match.phoneNumber);
    }
  };

  const filteredQueries = useMemo(() => {
    const list = showDeleted ? deletedQueries : activeQueries;
    if (!searchTerm.trim()) {
      return list;
    }
    const search = searchTerm.toLowerCase();
    return list.filter((query) =>
      query.customerName.toLowerCase().includes(search) ||
      query.phoneNumber.toLowerCase().includes(search) ||
      query.id.toLowerCase().includes(search) ||
      query.description.toLowerCase().includes(search)
    );
  }, [activeQueries, deletedQueries, showDeleted, searchTerm]);

  const nextQueryId = useMemo(() => {
    const maxId = queries.reduce((max, query) => {
      const numericId = Number.parseInt(query.id, 10);
      if (Number.isNaN(numericId)) {
        return max;
      }
      return numericId > max ? numericId : max;
    }, -1);
    return String(maxId + 1);
  }, [queries]);

  const nextJobId = useMemo(() => {
    const maxId = jobs.reduce((max, job) => {
      const numericId = Number.parseInt(job.id, 10);
      if (Number.isNaN(numericId)) {
        return max;
      }
      return numericId > max ? numericId : max;
    }, -1);
    return String(maxId + 1);
  }, [jobs]);

  const handleQuickAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!qaName.trim() || !qaPhone.trim()) {
      return;
    }

    const query: Query = {
      id: nextQueryId,
      customerName: qaName.trim(),
      phoneNumber: qaPhone.trim(),
      description: qaNote.trim() || 'Phone query',
      items: [],
      date: formatDateISO(),
    };

    dispatch(addQuery(query));
    setQaName('');
    setQaPhone('');
    setQaNote('');
    setToast(`Query #${nextQueryId} created!`);
  };

  const handleDelete = (query: Query) => {
    dispatch(deleteQuery(query.id));
  };

  const handleConvertToJob = (query: Query, jobType: JobCategory) => {
    const jobItems: JobItem[] = query.items.map((item) => ({
      description: item.description,
      price: 0,
    }));

    const job: Job = {
      id: nextJobId,
      category: jobType,
      customerName: query.customerName,
      phoneNumber: query.phoneNumber,
      address: '',
      importance: 'Medium',
      description: query.description,
      date: new Date().toISOString().split('T')[0],
      items: jobItems,
      status: 'not started',
    };

    dispatch(addJob(job));
    dispatch(deleteQuery(query.id));
    setToast(`Query converted to Job #${nextJobId}!`);

    setTimeout(() => history.push('/track'), 600);
  };

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <HelpCircle className="icon" />
                Queries
              </h1>
              <p className="muted">Quick-log phone calls & convert to jobs</p>
            </div>
            <div className="header-actions">
              <span className="pill">Active: {activeQueries.length}</span>
              <span className="pill">Deleted: {deletedQueries.length}</span>
            </div>
          </header>

          {/* Quick Add Form - always visible */}
          <form className="quick-add-form" onSubmit={handleQuickAdd}>
            <div className="quick-add-row">
              <div className="quick-add-field">
                <User className="icon" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={qaName}
                  onChange={(event) => handleCustomerNameChange(event.target.value)}
                  list="query-customer-suggestions"
                  autoComplete="off"
                  required
                />
                <datalist id="query-customer-suggestions">
                  {customers.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div className="quick-add-field">
                <Phone className="icon" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={qaPhone}
                  onChange={(event) => setQaPhone(event.target.value)}
                  required
                />
              </div>
              <div className="quick-add-field quick-add-note">
                <MessageSquare className="icon" />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={qaNote}
                  onChange={(event) => setQaNote(event.target.value)}
                />
              </div>
              <button type="submit" className="primary quick-add-btn">
                <PlusCircle className="icon" />
                Log Query
              </button>
            </div>
          </form>

          {/* Search + Toggle */}
          <div className="query-toolbar">
            <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
              <div className="input-with-icon">
                <Search className="icon" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className={`secondary query-toggle ${showDeleted ? 'active' : ''}`}
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? (
                <><List className="icon" /> Active ({activeQueries.length})</>
              ) : (
                <><TrashIcon className="icon" /> Deleted ({deletedQueries.length})</>
              )}
            </button>
          </div>

          {searchTerm && (
            <p className="muted" style={{ marginBottom: 'var(--space-2)', fontSize: '11px' }}>
              {filteredQueries.length} result{filteredQueries.length !== 1 ? 's' : ''} found
            </p>
          )}

          <QueryList
            queries={filteredQueries}
            onDelete={showDeleted ? undefined : handleDelete}
            onConvertToJob={handleConvertToJob}
          />
        </div>
      </main>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}
    </div>
  );
};

export default QueriesScreen;
