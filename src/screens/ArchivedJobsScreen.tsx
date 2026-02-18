import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Archive, Search } from 'lucide-react';
import { RootState } from '../store';
import JobList from '../components/JobList';
import SideNav from '../components/SideNav';
import { restoreJob, updateJobStatus } from '../store/jobReducer';
import { Job, JobStatus } from '../types';

const ArchivedJobsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const [searchTerm, setSearchTerm] = useState('');

  const archivedJobs = useMemo(() => jobs.filter((job) => job.isArchived), [jobs]);

  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) {
      return archivedJobs;
    }
    const search = searchTerm.toLowerCase();
    return archivedJobs.filter((job) =>
      job.customerName.toLowerCase().includes(search) ||
      job.phoneNumber.toLowerCase().includes(search) ||
      job.id.toLowerCase().includes(search) ||
      job.description.toLowerCase().includes(search) ||
      job.category.toLowerCase().includes(search) ||
      (job.invoiceNumber && job.invoiceNumber.toLowerCase().includes(search)) ||
      (job.address && job.address.toLowerCase().includes(search))
    );
  }, [archivedJobs, searchTerm]);

  const handleStatusChange = (id: string, status: JobStatus) => {
    dispatch(updateJobStatus(id, status));
  };

  const handleRestore = (job: Job) => {
    dispatch(restoreJob(job.id));
  };

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <Archive className="icon" />
                Archived Jobs
              </h1>
              <p className="muted">Fully paid & completed or deleted jobs older than 2 months</p>
            </div>
            <div className="header-actions">
              <span className="pill">{archivedJobs.length} archived</span>
            </div>
          </header>

          <div className="search-bar">
            <div className="input-with-icon">
              <Search className="icon" />
              <input
                type="text"
                placeholder="Search by name, phone, ID, invoice, description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            {searchTerm && (
              <span className="pill">
                {filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <section className="job-section archived-section">
            <JobList jobs={filteredJobs} onStatusChange={handleStatusChange} onRestore={handleRestore} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default ArchivedJobsScreen;
