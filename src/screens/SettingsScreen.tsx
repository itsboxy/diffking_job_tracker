import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Logo from '../components/Logo';
import SideNav from '../components/SideNav';
import {
  Archive,
  Brush,
  Cloud,
  Download,
  ImagePlus,
  RefreshCcw,
  RotateCcw,
  Settings as SettingsIcon,
  Upload,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { RootState, getSyncStatus, triggerManualRefresh, triggerManualSync } from '../store';
import { getSupabaseConfig } from '../supabaseClient';
import { setJobs } from '../store/jobReducer';
import { Job } from '../types';

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const dispatch = useDispatch();
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const audit = useSelector((state: RootState) => state.jobs.audit);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const supabaseConfig = getSupabaseConfig();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        setSyncStatus(detail);
      }
    };
    window.addEventListener('supabase-sync-status', handler as EventListener);
    return () => window.removeEventListener('supabase-sync-status', handler as EventListener);
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ logoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoDataUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diff-king-jobs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = [
      'id',
      'customerName',
      'phoneNumber',
      'address',
      'invoiceNumber',
      'quoteNumber',
      'importance',
      'category',
      'date',
      'status',
      'description',
    ];
    const rows = jobs.map((job) =>
      headers
        .map((key) => {
          const value = job[key as keyof Job] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diff-king-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid file');
        }
        const confirmed = window.confirm('Replace all current jobs with the imported file?');
        if (!confirmed) {
          return;
        }
        dispatch(setJobs(parsed));
      } catch (error) {
        window.alert('Unable to import file. Please select a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const syncStateLabel = syncStatus.state === 'idle' ? 'Not synced'
    : syncStatus.state === 'syncing' ? 'Syncing...'
    : syncStatus.state === 'success' ? 'Synced'
    : 'Error';

  const syncStateClass = syncStatus.state === 'success' ? 'sync-success'
    : syncStatus.state === 'error' ? 'sync-error'
    : syncStatus.state === 'syncing' ? 'sync-syncing'
    : '';

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <SettingsIcon className="icon" />
                Settings
              </h1>
            </div>
          </header>

          <div className="settings-grid">
            <section className="settings-card">
              <div className="settings-card-header">
                <Brush className="icon" />
                <div>
                  <h3>Appearance</h3>
                  <p className="muted">Theme and layout preferences</p>
                </div>
              </div>
              <div className="settings-card-body">
                <label>
                  Theme
                  <select
                    value={settings.theme}
                    onChange={(event) => updateSettings({ theme: event.target.value as 'light' | 'dark' })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label>
                  Font Size
                  <select
                    value={settings.fontSize}
                    onChange={(event) => updateSettings({ fontSize: event.target.value as 'sm' | 'md' | 'lg' })}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </label>
                <label>
                  Default Tracking Category
                  <select
                    value={settings.defaultTrackingCategory || 'All'}
                    onChange={(event) =>
                      updateSettings({
                        defaultTrackingCategory: event.target.value as
                          | 'All'
                          | 'Repair'
                          | 'Fabrication'
                          | 'Deliveries and Dispatch',
                      })
                    }
                  >
                    <option value="All">All Jobs</option>
                    <option value="Repair">Repair</option>
                    <option value="Fabrication">Fabrication</option>
                    <option value="Deliveries and Dispatch">Deliveries & Dispatch</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <Cloud className="icon" />
                <div>
                  <h3>Cloud Sync</h3>
                  <p className="muted">Supabase live sync across stations</p>
                </div>
              </div>
              <div className="settings-card-body">
                <label>
                  Supabase URL
                  <input
                    type="text"
                    value={settings.supabaseUrl || ''}
                    onChange={(event) => updateSettings({ supabaseUrl: event.target.value })}
                    placeholder="https://your-project.supabase.co"
                  />
                </label>
                <label>
                  Supabase Anon Key
                  <input
                    type="password"
                    value={settings.supabaseAnonKey || ''}
                    onChange={(event) => updateSettings({ supabaseAnonKey: event.target.value })}
                    placeholder="Your anon public key"
                  />
                </label>
                <div className={`sync-status-bar ${syncStateClass}`}>
                  <span className="sync-dot" />
                  <span>{syncStateLabel}</span>
                  {syncStatus.message ? <span className="sync-message">— {syncStatus.message}</span> : null}
                  {syncStatus.timestamp ? (
                    <span className="sync-time">{new Date(syncStatus.timestamp).toLocaleTimeString()}</span>
                  ) : null}
                </div>
                <div className="settings-actions">
                  <button type="button" className="secondary" onClick={() => triggerManualSync()}>
                    <Upload className="icon" />
                    Push to Cloud
                  </button>
                  <button type="button" className="secondary" onClick={() => triggerManualRefresh()}>
                    <RefreshCcw className="icon" />
                    Pull from Cloud
                  </button>
                </div>
                <p className="muted" style={{ fontSize: '10px' }}>
                  Resolved: {supabaseConfig.url || 'Not configured'}
                </p>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <ImagePlus className="icon" />
                <div>
                  <h3>Brand Logo</h3>
                  <p className="muted">Used on printed invoices</p>
                </div>
              </div>
              <div className="settings-card-body">
                <div className="logo-preview">
                  <Logo size={48} />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <div className="settings-actions">
                  <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="icon" />
                    Upload Logo
                  </button>
                  {settings.logoDataUrl ? (
                    <button type="button" className="danger" onClick={handleRemoveLogo}>
                      <RotateCcw className="icon" />
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <Download className="icon" />
                <div>
                  <h3>Backup & Export</h3>
                  <p className="muted">Save or restore the job list</p>
                </div>
              </div>
              <div className="settings-card-body">
                <div className="settings-actions">
                  <button type="button" className="secondary" onClick={handleExportJson}>
                    <Download className="icon" />
                    Export JSON
                  </button>
                  <button type="button" className="secondary" onClick={handleExportCsv}>
                    <Download className="icon" />
                    Export CSV
                  </button>
                  <button type="button" className="secondary" onClick={() => importInputRef.current?.click()}>
                    <Upload className="icon" />
                    Import JSON
                  </button>
                </div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  style={{ display: 'none' }}
                />
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <RotateCcw className="icon" />
                <div>
                  <h3>Reset</h3>
                  <p className="muted">Restore default appearance settings</p>
                </div>
              </div>
              <div className="settings-card-body">
                <button type="button" className="danger" onClick={resetSettings}>
                  <RotateCcw className="icon" />
                  Reset All Settings
                </button>
              </div>
            </section>

            <section className="settings-card settings-card-full">
              <div className="settings-card-header">
                <Archive className="icon" />
                <div>
                  <h3>Audit Log</h3>
                  <p className="muted">Recent sync and job updates</p>
                </div>
              </div>
              <div className="settings-card-body">
                {audit.length === 0 ? (
                  <p className="muted">No audit entries yet.</p>
                ) : (
                  <div className="audit-log">
                    {audit.slice(0, 20).map((entry) => (
                      <div key={entry.id} className="audit-row">
                        <div>
                          <strong>{entry.action.replace(/_/g, ' ')}</strong>
                          <p className="muted">{entry.summary}</p>
                        </div>
                        <span className="muted">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsScreen;
