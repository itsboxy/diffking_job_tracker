import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from './constants/config';
import { decrypt } from './utils/encryption';

export const getSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '' };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return { url: '', anonKey: '' };
    }
    const settings = JSON.parse(raw) as { supabaseUrl?: string; supabaseAnonKey?: string };

    // Decrypt credentials if they exist
    const url = settings.supabaseUrl ? decrypt(settings.supabaseUrl).trim() : '';
    const anonKey = settings.supabaseAnonKey ? decrypt(settings.supabaseAnonKey).trim() : '';

    return { url, anonKey };
  } catch (error) {
    return { url: '', anonKey: '' };
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};

let client: SupabaseClient | null = null;

export const resetSupabaseClient = (): void => {
  client = null;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (client) {
    return client;
  }

  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    console.warn('Supabase config missing. Configure in Settings.');
    return null;
  }

  client = createClient(url, anonKey);
  return client;
};
