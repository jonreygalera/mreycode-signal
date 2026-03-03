export interface AppSettings {
  timezone: string;
  backgroundImage: string | null;
  useBgInClock: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
};
