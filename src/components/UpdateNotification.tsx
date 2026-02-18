import React, { useEffect, useState } from 'react';
import { AlertCircle, Download, RefreshCw, X } from 'lucide-react';
import {
  checkForUpdates,
  installUpdate,
  onUpdateAvailable,
  onUpdateDownloaded,
  onUpdateError,
  onUpdateProgress,
  startUpdateDownload,
} from '../utils/ipc';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

const UpdateNotification: React.FC = () => {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    onUpdateAvailable((info) => {
      setVersion(info.version);
      setState('available');
      setDismissed(false);
    });

    onUpdateProgress((info) => {
      setProgress(info.percent);
      setState('downloading');
    });

    onUpdateDownloaded(() => {
      setState('ready');
    });

    onUpdateError((info) => {
      // Only the main process sends UPDATE_ERROR when a user-initiated download
      // fails, so we can always show the error here.
      setErrorMessage(info.message || 'Update failed');
      setState('error');
    });
  }, []);

  if (state === 'idle' || dismissed) {
    return null;
  }

  const handleDownload = () => {
    // Set downloading immediately so any subsequent error is shown correctly.
    setProgress(0);
    setState('downloading');
    startUpdateDownload();
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    checkForUpdates();
  };

  return (
    <div className="update-banner">
      {state === 'available' && (
        <>
          <span>Version {version} is available</span>
          <button type="button" className="update-btn primary" onClick={handleDownload}>
            <Download className="icon" />
            Update Now
          </button>
          <button type="button" className="update-btn secondary" onClick={() => setDismissed(true)}>
            Later
          </button>
        </>
      )}

      {state === 'downloading' && (
        <>
          <span>Downloading update… {progress}%</span>
          <div className="update-progress-bar">
            <div className="update-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </>
      )}

      {state === 'ready' && (
        <>
          <span>Update ready — restart to apply</span>
          <button type="button" className="update-btn primary" onClick={() => installUpdate()}>
            <RefreshCw className="icon" />
            Restart Now
          </button>
          <button type="button" className="update-btn secondary" onClick={() => setDismissed(true)}>
            Later
          </button>
        </>
      )}

      {state === 'error' && (
        <>
          <AlertCircle className="icon" />
          <span title={errorMessage}>Update failed — {errorMessage || 'please try again'}</span>
          <button type="button" className="update-btn primary" onClick={handleRetry}>
            <RefreshCw className="icon" />
            Try Again
          </button>
          <button type="button" className="update-btn secondary" onClick={() => setDismissed(true)}>
            <X className="icon" />
            Dismiss
          </button>
        </>
      )}
    </div>
  );
};

export default UpdateNotification;
