export interface AppSettings {
  timezone: string;
  backgroundImage: string | null;
  useBgInClock: boolean;
  tvCarouselEnabled: boolean;
  tvCarouselInterval: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
  tvCarouselEnabled: false,
  tvCarouselInterval: 30,
};
