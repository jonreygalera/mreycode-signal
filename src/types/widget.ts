export type WidgetType = 'stat' | 'line' | 'bar' | 'area' | 'iframe' | 'list' | 'clock' | 'progress' | 'status';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WidgetConfig {
  id: string;
  label: string;
  type: WidgetType;
  api?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  responsePath?: string; // Used to pick nested data points
  transformer?: string; // JavaScript code to transform the response value
  displayType?: 'analog' | 'digital'; // For clock
  iframeUrl?: string; // For iframe widget
  accentColor?: string; // Custom glow/border color
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
  color?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
  colorRules?: {
    aboveZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    belowZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    atZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    // Highly flexible custom rules
    rules?: Array<{
      condition: 'above' | 'below' | 'at';
      value: number;
      color: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    }>;
  };
}
