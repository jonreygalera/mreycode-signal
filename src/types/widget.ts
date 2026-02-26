export type WidgetType = 'stat' | 'line' | 'bar' | 'area';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetConfig {
  id: string;
  label: string;
  type: WidgetType;
  api: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  responsePath: string; // Used to pick nested data points
  xKey?: string;        // Used for charts
  yKey?: string;        // Used for charts
  size?: WidgetSize;
  refreshInterval?: number; // ms interval auto refresh (0 or undefined for no auto-refresh)
  description?: string;
  source?: string;
  sourceUrl?: string; // Links to the human-readable source page
  prefix?: string;
  suffix?: string;
  isTemp?: boolean;
  abbreviate?: boolean;
  color?: 'up' | 'down' | 'muted' | 'foreground';
}
