import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Filter,
  LayoutDashboard,
  RotateCcw,
  Search,
} from 'lucide-react';
import JobList from '../components/JobList';
import Toast from '../components/Toast';
import JobEditModal from '../components/JobEditModal';
import { archiveJobs, clearJobs, deleteJob, restoreJob, updateJob, updateJobStatus } from '../store/jobReducer';
import { Job, JobCategory, JobImportance, JobStatus } from '../types';
import { RootState } from '../store';
import Logo from '../components/Logo';
import SideNav from '../components/SideNav';
import { useSettings } from '../context/SettingsContext';
import { getUrgencyFromDate } from '../utils/urgency';
import { CATEGORY_LABELS } from '../constants/labels';
import { generateJobPrintHtml } from '../utils/printHtml';
import { generateJobPDF, printJob } from '../utils/ipc';

const categories: Array<JobCategory | 'All'> = [
  'All',
  'Repair',
  'Fabrication',
  'Deliveries and Dispatch',
];

const categoryLabels: Record<JobCategory | 'All', string> = {
  All: 'All Jobs',
  ...CATEGORY_LABELS,
};

const importanceRank: Record<JobImportance, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const JobTrackingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { settings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<JobCategory | 'All'>(
    settings.defaultTrackingCategory || 'All'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [importanceFilter, setImportanceFilter] = useState<JobImportance | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['completed', 'deleted']));
  const [toast, setToast] = useState<string | null>(null);
  const jobs = useSelector((state: RootState) => state.jobs.jobs);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  useEffect(() => {
    setActiveCategory(settings.defaultTrackingCategory || 'All');
  }, [settings.defaultTrackingCategory]);

  const filteredJobs = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const categoryFiltered = activeCategory === 'All'
      ? jobs
      : jobs.filter((job) => job.category === activeCategory);

    const searched = normalizedTerm
      ? categoryFiltered.filter((job) => {
          const matches = [
            job.id,
            job.customerName,
            job.phoneNumber,
            job.invoiceNumber,
            job.quoteNumber,
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase());

          return matches.some((value) => value.includes(normalizedTerm));
        })
      : categoryFiltered;

    const statusFiltered = statusFilter === 'all'
      ? searched
      : searched.filter((job) => job.status === statusFilter);

    const importanceFiltered = importanceFilter === 'all'
      ? statusFiltered
      : statusFiltered.filter((job) =>
          getUrgencyFromDate(job.estimatedDispatchDate || job.date) === importanceFilter
        );

    const dateFiltered = importanceFiltered.filter((job) => {
      if (!dateFrom && !dateTo) {
        return true;
      }
      if (dateFrom && job.date < dateFrom) {
        return false;
      }
      if (dateTo && job.date > dateTo) {
        return false;
      }
      return true;
    });

    return [...dateFiltered]
      .filter((job) => !job.isArchived)
      .sort((a, b) => {
        const importanceDelta =
          importanceRank[getUrgencyFromDate(a.estimatedDispatchDate || a.date)] -
          importanceRank[getUrgencyFromDate(b.estimatedDispatchDate || b.date)];
        if (importanceDelta !== 0) {
          return importanceDelta;
        }
        return b.date.localeCompare(a.date);
      });
  }, [activeCategory, jobs, searchTerm, statusFilter, importanceFilter, dateFrom, dateTo]);

  // Helper to check if a job is fully paid
  const isJobFullyPaid = (job: Job): boolean => {
    const total = job.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const paid = job.totalPaid || 0;
    return paid > 0 && paid >= total;
  };

  // Active Jobs: NOT deleted AND NOT (complete + fully paid)
  // This means: unpaid jobs stay here even if complete, paid but not complete stays here too
  const activeJobs = filteredJobs.filter((job) => {
    if (job.isDeleted) return false;
    // If complete AND fully paid, it goes to Paid & Completed
    if (job.status === 'complete' && isJobFullyPaid(job)) return false;
    return true;
  });

  // Paid & Completed: complete AND fully paid
  const paidCompletedJobs = filteredJobs.filter((job) => {
    if (job.isDeleted) return false;
    return job.status === 'complete' && isJobFullyPaid(job);
  });

  const deletedJobs = filteredJobs.filter((job) => job.isDeleted);

  const handleStatusChange = (id: string, status: JobStatus) => {
    const job = jobs.find((entry) => entry.id === id);
    const wasComplete = job?.status === 'complete';
    dispatch(updateJobStatus(id, status));

    if (job && status === 'complete' && !wasComplete) {
      const html = generateJobPrintHtml({ ...job, status }, settings.logoDataUrl);
      printJob(html);
      generateJobPDF(html, job.id);
    }
  };

  const handleDeleteJob = (job: Job) => {
    const confirmed = window.confirm(
      `Delete job ${job.id}? You can restore it from the Deleted section.`
    );
    if (!confirmed) {
      return;
    }
    dispatch(deleteJob(job.id));
  };

  const handleRestoreJob = (job: Job) => {
    dispatch(restoreJob(job.id));
  };

  const handleResetBoard = () => {
    const confirmed = window.confirm(
      'Reset the board? This will remove all jobs (Active, Completed, and Deleted).'
    );
    if (!confirmed) {
      return;
    }
    dispatch(clearJobs());
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleSaveEdit = (updatedJob: Job) => {
    dispatch(updateJob(updatedJob));
    setEditingJob(null);
    setToast(`Job #${updatedJob.id} updated successfully!`);
  };

  const handleSendToDispatch = (job: Job) => {
    dispatch(
      updateJob({
        ...job,
        category: 'Deliveries and Dispatch',
      })
    );
  };

  const handleArchiveJob = (job: Job) => {
    dispatch(archiveJobs([job.id], new Date().toISOString()));
  };

  const handleAddPayment = (job: Job, amount: number) => {
    const newPayment = {
      amount,
      date: new Date().toISOString().split('T')[0],
    };
    const existingHistory = job.paymentHistory || [];
    const newTotalPaid = (job.totalPaid || 0) + amount;
    dispatch(
      updateJob({
        ...job,
        totalPaid: newTotalPaid,
        paymentHistory: [...existingHistory, newPayment],
      })
    );
  };

  const toggleSelect = (jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedJobs = filteredJobs.filter((job) => selectedIds.has(job.id));

  const bulkComplete = useCallback(() => {
    selectedJobs.forEach((job) => dispatch(updateJobStatus(job.id, 'complete')));
    clearSelection();
  }, [dispatch, selectedJobs]);

  const bulkDelete = useCallback(() => {
    if (!selectedJobs.length) {
      return;
    }
    const confirmed = window.confirm(`Delete ${selectedJobs.length} selected jobs?`);
    if (!confirmed) {
      return;
    }
    selectedJobs.forEach((job) => dispatch(deleteJob(job.id)));
    clearSelection();
  }, [dispatch, selectedJobs]);

  const bulkRestore = useCallback(() => {
    selectedJobs.forEach((job) => dispatch(restoreJob(job.id)));
    clearSelection();
  }, [dispatch, selectedJobs]);

  const bulkPrint = async () => {
    for (const job of selectedJobs) {
      const html = generateJobPrintHtml(job, settings.logoDataUrl);
      const result = await printJob(html);
      if (result && result.success === false) {
        window.alert(result.error || 'Unable to print job.');
        break;
      }
    }
  };

  const bulkPdf = async () => {
    for (const job of selectedJobs) {
      const html = generateJobPrintHtml(job, settings.logoDataUrl);
      const result = await generateJobPDF(html, job.id);
      if (result && result.success === false) {
        window.alert(result.error || 'Unable to save PDF.');
        break;
      }
    }
  };

  const handleSavePdf = async (job: Job) => {
    console.log('handleSavePdf called for job:', job.id);
    try {
      if (!('electronAPI' in window)) {
        alert('Electron API not available. Please restart the application.');
        console.error('electronAPI not found on window object');
        return;
      }
      const html = generateJobPrintHtml(job, settings.logoDataUrl);
      console.log('Generated HTML, calling generateJobPDF...');
      const result = await generateJobPDF(html, job.id);
      console.log('PDF result:', result);
      if (result && result.success === false) {
        alert(result.error || 'Unable to save PDF.');
      } else if (result && result.success === true) {
        alert(`PDF saved to: ${result.path}`);
      }
    } catch (error) {
      console.error('Error in handleSavePdf:', error);
      alert(`Error saving PDF: ${(error as Error).message}`);
    }
  };

  const handlePrint = async (job: Job) => {
    console.log('handlePrint called for job:', job.id);
    try {
      if (!('electronAPI' in window)) {
        alert('Electron API not available. Please restart the application.');
        console.error('electronAPI not found on window object');
        return;
      }
      const html = generateJobPrintHtml(job, settings.logoDataUrl);
      console.log('Generated HTML, calling printJob...');
      const result = await printJob(html);
      console.log('Print result:', result);
      if (result && result.success === false) {
        alert(result.error || 'Unable to print job.');
      } else if (result && result.success === true) {
        console.log('Print completed successfully');
      }
    } catch (error) {
      console.error('Error in handlePrint:', error);
      alert(`Error printing: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>('.search-bar input[type="search"]');
        input?.focus();
      }
      if (event.key === 'Escape') {
        setSearchTerm('');
        setSelectedIds(new Set());
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelectedIds(new Set(filteredJobs.map((job) => job.id)));
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        bulkComplete();
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        bulkDelete();
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        bulkRestore();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredJobs, bulkComplete, bulkDelete, bulkRestore]);

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
      <div className="screen">
      <header className="screen-header">
        <div>
          <Logo />
          <h1>
            <LayoutDashboard className="icon" />
            Touchscreen Job Board
          </h1>
          <p className="muted">Tap a job to update its status.</p>
        </div>
      </header>
      <div className="page-toolbar">
        <button type="button" className="danger" onClick={handleResetBoard}>
          <RotateCcw className="icon" />
          Reset Board
        </button>
      </div>

      <section className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </section>

      <section className="search-bar">
        <label className="search-field">
          <span className="field-label">
            <Search className="icon" />
            Search Jobs
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by Job ID, Customer, Phone, Invoice, or Quote"
          />
        </label>
      </section>

      <section className="filter-bar">
        <div className="filter-title">
          <Filter className="icon" />
          Filters
        </div>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as JobStatus | 'all')}>
            <option value="all">All</option>
            <option value="not started">Not Started</option>
            <option value="in progress">In Progress</option>
            <option value="awaiting parts">Awaiting Parts</option>
            <option value="powdercoaters">Powdercoaters</option>
            <option value="complete">Complete</option>
          </select>
        </label>
        <label>
          Urgency
          <select value={importanceFilter} onChange={(event) => setImportanceFilter(event.target.value as JobImportance | 'all')}>
            <option value="all">All</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Date From
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          Date To
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
      </section>

      <section className="bulk-actions">
        <span className="muted">Selected: {selectedJobs.length}</span>
        <div className="bulk-buttons">
          <button type="button" className="secondary" onClick={bulkComplete}>
            <ClipboardCheck className="icon" />
            Mark Complete
          </button>
          <button type="button" className="secondary" onClick={bulkPrint}>
            Print
          </button>
          <button type="button" className="secondary" onClick={bulkPdf}>
            Save PDF
          </button>
          <button type="button" className="danger" onClick={bulkDelete}>
            Delete
          </button>
          <button type="button" className="secondary" onClick={bulkRestore}>
            Restore
          </button>
          <button type="button" className="secondary" onClick={clearSelection}>
            Clear Selection
          </button>
        </div>
      </section>

      <section className={`job-section active-section ${collapsedSections.has('active') ? 'collapsed' : ''}`}>
        <button
          type="button"
          className="job-section-header"
          onClick={() => toggleSection('active')}
        >
          <div className="section-title">
            {collapsedSections.has('active') ? <ChevronRight className="icon" /> : <ChevronDown className="icon" />}
            <h2>Active Jobs</h2>
            <span className="badge">{activeJobs.length}</span>
          </div>
        </button>
        {!collapsedSections.has('active') && (
          <JobList
            jobs={activeJobs}
            onStatusChange={handleStatusChange}
            onPrint={handlePrint}
            onSavePdf={handleSavePdf}
            onDelete={handleDeleteJob}
            onEdit={handleEditJob}
            onSendToDispatch={handleSendToDispatch}
            onArchive={handleArchiveJob}
            onAddPayment={handleAddPayment}
            selectedJobIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </section>

      <section className={`job-section completed-section ${collapsedSections.has('completed') ? 'collapsed' : ''}`}>
        <button
          type="button"
          className="job-section-header"
          onClick={() => toggleSection('completed')}
        >
          <div className="section-title">
            {collapsedSections.has('completed') ? <ChevronRight className="icon" /> : <ChevronDown className="icon" />}
            <h2>Paid & Completed</h2>
            <span className="badge">{paidCompletedJobs.length}</span>
          </div>
        </button>
        {!collapsedSections.has('completed') && (
          <JobList
            jobs={paidCompletedJobs}
            onStatusChange={handleStatusChange}
            onPrint={handlePrint}
            onSavePdf={handleSavePdf}
            onDelete={handleDeleteJob}
            onEdit={handleEditJob}
            onSendToDispatch={handleSendToDispatch}
            onArchive={handleArchiveJob}
            selectedJobIds={selectedIds}
            onToggleSelect={toggleSelect}
            hideUrgency
          />
        )}
      </section>

      <section className={`job-section deleted-section ${collapsedSections.has('deleted') ? 'collapsed' : ''}`}>
        <button
          type="button"
          className="job-section-header"
          onClick={() => toggleSection('deleted')}
        >
          <div className="section-title">
            {collapsedSections.has('deleted') ? <ChevronRight className="icon" /> : <ChevronDown className="icon" />}
            <h2>Deleted Jobs</h2>
            <span className="badge danger">{deletedJobs.length}</span>
          </div>
        </button>
        {!collapsedSections.has('deleted') && (
          <JobList
            jobs={deletedJobs}
            onStatusChange={handleStatusChange}
            onPrint={handlePrint}
            onSavePdf={handleSavePdf}
            onRestore={handleRestoreJob}
            onEdit={handleEditJob}
            onSendToDispatch={handleSendToDispatch}
            selectedJobIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </section>


      {editingJob ? (
        <JobEditModal
          job={editingJob}
          onCancel={() => setEditingJob(null)}
          onSave={handleSaveEdit}
        />
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
    </main>
    </div>
  );
};

export default JobTrackingScreen;
