import React from 'react';
import { JobStatus as Status } from '../types';
import { formatStatus } from '../utils/formatters';

interface JobStatusProps {
  jobId: string;
  status: Status;
  onChange: (id: string, status: Status) => void;
}

const statusOptions: Status[] = [
  'not started',
  'in progress',
  'awaiting parts',
  'powdercoaters',
  'complete',
];

const JobStatus: React.FC<JobStatusProps> = ({ jobId, status, onChange }) => {
  return (
    <select
      className={`status-select status-${status.replace(' ', '-')}`}
      value={status}
      onChange={(event) => onChange(jobId, event.target.value as Status)}
    >
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {formatStatus(option)}
        </option>
      ))}
    </select>
  );
};

export default JobStatus;
