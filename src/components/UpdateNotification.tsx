import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import {
  onUpdateAvailable,
  onUpdateProgress,
  onUpdateDownloaded,
  onUpdateError,
  startUpdateDownload,
  installUpdate,
} from '../utils/ipc';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

const UpdateNotification: React.FC = () => {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
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

    onUpdateError(() => {
      setState('error');
    });
  }, []);

  if (state === 'idle' || dismissed) {
    return null;
  }

  return (
    <div className="update-banner">
      {state === 'available' && (
        <>
          <span>Version {version} is available</span>
          <button type="button" className="update-btn primary" onClick={() => startUpdateDownload()}>
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
          <span>Downloading update... {progress}%</span>
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
          <span>Update check failed</span>
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
