import { createClient } from '@supabase/supabase-js';

// Basic obfuscation as requested by the user
export const encodeCredential = (value: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return btoa(value);
  } catch (e) {
    return value;
  }
};

export const decodeCredential = (value: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return atob(value);
  } catch (e) {
    return value;
  }
};

let supabaseInstance: any = null;

export const getSupabaseClient = (url?: string, key?: string) => {
  if (supabaseInstance && !url && !key) return supabaseInstance;

  if (url && key) {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  }

  // Try to load from localStorage if not provided
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        const { url: encUrl, key: encKey, isConfigured } = settings.supabaseConfig || {};
        if (isConfigured && encUrl && encKey) {
          supabaseInstance = createClient(decodeCredential(encUrl), decodeCredential(encKey));
          return supabaseInstance;
        }
      } catch (e) {
        console.error('Failed to initialize Supabase from settings', e);
      }
    }
  }

  return null;
};
