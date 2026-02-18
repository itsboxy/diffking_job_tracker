import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ClipboardList, Touchpad } from 'lucide-react';
import { addJob } from '../store/jobReducer';
import { Customer, Job } from '../types';
import JobForm, { JobDraft } from '../components/JobForm';
import Toast from '../components/Toast';
import { RootState } from '../store';
import SideNav from '../components/SideNav';

const JobCreationScreen: React.FC = () => {
  const dispatch = useDispatch();
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const jobCount = jobs.filter((job) => !job.isDeleted && !job.isArchived).length;
  const [toast, setToast] = useState<string | null>(null);

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
    return Array.from(map.values());
  }, [jobs]);

  const handleSubmit = (draft: JobDraft) => {
    const job: Job = {
      id: nextJobId,
      status: 'not started',
      ...draft,
    };

    dispatch(addJob(job));
    setToast(`Job #${nextJobId} created successfully!`);
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
                <ClipboardList className="icon" />
                Main Office
              </h1>
              <p className="muted">Create New Jobs</p>
            </div>
            <div className="header-actions">
              <span className="pill">Next Job ID: {nextJobId}</span>
              <span className="pill">Total Jobs: {jobCount}</span>
              <Link className="primary" to="/track">
                <Touchpad className="icon" />
                Go to Touchscreen
              </Link>
            </div>
          </header>

          <JobForm onSubmit={handleSubmit} customers={customers} />
        </div>
      </main>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}
    </div>
  );
};

export default JobCreationScreen;
