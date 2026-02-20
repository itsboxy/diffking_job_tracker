import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineOverlay: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-overlay">
      <div className="offline-card">
        <WifiOff className="offline-icon" />
        <h2>No Internet Connection</h2>
        <p>Check your network and try again.<br />The app will reconnect automatically.</p>
      </div>
    </div>
  );
};

export default OfflineOverlay;
