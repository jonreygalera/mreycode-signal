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
  supabaseRealtimeEnabled: boolean;
  maxWorkspaces: number;
  maxWidgetsPerWorkspace: number;
  connectivityUrl: string;
  connectivityEvery: number;
  connectivityMode: 'icon' | 'numeric';
  connectivityThresholdExcellent: number;
  connectivityThresholdGood: number;
  connectivityThresholdAverage: number;
  connectivityThresholdSlow: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
  tvCarouselEnabled: true,
  tvCarouselInterval: 30,
  snackbarPosition: 'top-right',
  localStorageThreshold: 90,
  maximizedCarouselEnabled: true,
  maximizedCarouselInterval: 20,
  storageType: 'local',
  supabaseConfig: {
    url: '',
    key: '',
    isConfigured: false
  },
  supabaseRealtimeEnabled: false,
  maxWorkspaces: 3,
  maxWidgetsPerWorkspace: 5,
  connectivityUrl: 'https://dns.google/resolve?name=google.com',
  connectivityEvery: 30,
  connectivityMode: 'icon',
  connectivityThresholdExcellent: 20,
  connectivityThresholdGood: 50,
  connectivityThresholdAverage: 100,
  connectivityThresholdSlow: 150,
};

