export interface AppSettings {
  timezone: string;
  backgroundImage: string | null;
  useBgInClock: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  backgroundImage: null,
  useBgInClock: false,
  autoRefresh: true,
  refreshInterval: 60, // Default to 60 seconds
};
