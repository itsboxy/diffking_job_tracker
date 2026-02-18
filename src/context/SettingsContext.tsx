import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { JobCategory } from '../types';
import { STORAGE_KEYS } from '../constants/config';
import { encrypt, decrypt } from '../utils/encryption';
import { resetSupabaseClient } from '../supabaseClient';

type ThemeMode = 'light' | 'dark';
type FontSize = 'sm' | 'md' | 'lg';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  logoDataUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  defaultTrackingCategory?: JobCategory | 'All';
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  fontSize: 'md',
  logoDataUrl: undefined,
  supabaseUrl: undefined,
  supabaseAnonKey: undefined,
  defaultTrackingCategory: 'All',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const loadSettings = (): AppSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;

    // Decrypt Supabase credentials if they exist
    if (parsed.supabaseUrl) {
      parsed.supabaseUrl = decrypt(parsed.supabaseUrl);
    }
    if (parsed.supabaseAnonKey) {
      parsed.supabaseAnonKey = decrypt(parsed.supabaseAnonKey);
    }

    return parsed;
  } catch (error) {
    return defaultSettings;
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() =>
    typeof window === 'undefined' ? defaultSettings : loadSettings()
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = settings.theme;
      document.body.dataset.fontSize = settings.fontSize;
    }

    try {
      // Encrypt credentials before saving
      const settingsToSave = { ...settings };
      if (settingsToSave.supabaseUrl) {
        settingsToSave.supabaseUrl = encrypt(settingsToSave.supabaseUrl);
      }
      if (settingsToSave.supabaseAnonKey) {
        settingsToSave.supabaseAnonKey = encrypt(settingsToSave.supabaseAnonKey);
      }

      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsToSave));
    } catch (error) {
      // ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    if (updates.supabaseUrl !== undefined || updates.supabaseAnonKey !== undefined) {
      resetSupabaseClient();
    }
    setSettings((current) => ({ ...current, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
