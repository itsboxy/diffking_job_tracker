import React from 'react';
import { useSettings } from '../context/SettingsContext';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = true }) => {
  const { settings } = useSettings();
  return (
    <div className="logo">
      {settings.logoDataUrl ? (
        <img src={settings.logoDataUrl} alt="Diff King" style={{ width: size, height: size }} />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="diffKingGradient" x1="0" y1="0" x2="64" y2="64">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#diffKingGradient)" />
          <path
            d="M18 18h12c9 0 16 6 16 14s-7 14-16 14H18V18zm12 8h-4v12h4c4.6 0 8-2.6 8-6s-3.4-6-8-6z"
            fill="#fff"
          />
          <path d="M24 44h22v6H24v-6z" fill="#fff" opacity="0.25" />
        </svg>
      )}
      {showText ? (
        <div className="logo-text">
          <span>DIFF KING</span>
          <small>Job Tracker</small>
        </div>
      ) : null}
    </div>
  );
};

export default Logo;
