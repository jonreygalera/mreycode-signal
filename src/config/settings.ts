export interface AppSettings {
  timezone: string;
  backgroundImage: string | null;
  useBgInClock: boolean;
  tvCarouselEnabled: boolean;
  tvCarouselInterval: number;
  snackbarPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  localStorageThreshold: number;
  maximizedCarouselEnabled: boolean;
  maximizedCarouselInterval: number;
  storageType: 'local' | 'supabase';
  supabaseConfig: {
    url: string;
    key: string;
    isConfigured: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
  tvCarouselEnabled: false,
  tvCarouselInterval: 30,
  snackbarPosition: 'top-right',
  localStorageThreshold: 90,
  maximizedCarouselEnabled: false,
  maximizedCarouselInterval: 20,
  storageType: 'local',
  supabaseConfig: {
    url: '',
    key: '',
    isConfigured: false
  },
};

