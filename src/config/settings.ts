export interface AppSettings {
  timezone: string;
  backgroundImage: string | null;
  useBgInClock: boolean;
  tvCarouselEnabled: boolean;
  tvCarouselInterval: number;
  snackbarPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  localStorageThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
  tvCarouselEnabled: false,
  tvCarouselInterval: 30,
  snackbarPosition: 'top-right',
  localStorageThreshold: 90,
};

