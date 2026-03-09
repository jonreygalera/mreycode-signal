import { SignalConfig } from './signal';
export type WidgetType = 'stat' | 'chart' | 'iframe' | 'list' | 'clock' | 'progress' | 'status' | 'label';
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';
export type ChartType = 'line' | 'bar' | 'area';

export interface BaseWidgetConfig {
  id: string;
  label: string;
  type: WidgetType;
  size?: WidgetSize;
  description?: string;
  accentColor?: string; // Custom glow/border color
  
  // Data Fetching
  api?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  responsePath?: string;
  transformer?: string;
  refreshInterval?: number;
  
  // Metadata
  source?: string;
  sourceUrl?: string;
  isTemp?: boolean;

  // Visual Rules
  color?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
  colorRules?: {
    aboveZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    belowZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    atZero?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    rules?: Array<{
      condition: 'above' | 'below' | 'at';
      value: number;
      color: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
    }>;
  };
  
  // Signals (Alerting)
  signals?: SignalConfig[];
}

export interface StatConfig extends BaseWidgetConfig {
  type: 'stat';
  config?: {
    prefix?: string;
    suffix?: string;
    abbreviate?: boolean;
  };
}

export interface ChartConfig extends BaseWidgetConfig {
  type: 'chart';
  config: {
    chart: ChartType;
    xKey: string;
    yKey: string;
    prefix?: string;
    suffix?: string;
  };
}

export interface ClockConfig extends BaseWidgetConfig {
  type: 'clock';
  config?: {
    displayType?: 'analog' | 'digital';
    timezone?: string;
  };
}

export interface IframeConfig extends BaseWidgetConfig {
  type: 'iframe';
  config?: {
    iframeUrl?: string;
  };
}

export interface ListConfig extends BaseWidgetConfig {
  type: 'list';
  config?: {
    // List specific settings can go here
  };
}

export interface ProgressConfig extends BaseWidgetConfig {
  type: 'progress';
  config?: {
    // Progress specific settings
  };
}

export interface StatusConfig extends BaseWidgetConfig {
  type: 'status';
  config?: {
    trueLabel?: string;
    falseLabel?: string;
    trueIcon?: string;
    falseIcon?: string;
  };
}

export interface LabelConfig extends BaseWidgetConfig {
  type: 'label';
  config?: {
    subtitle?: string;
    icon?: string;
    align?: 'left' | 'center' | 'right';
    variant?: 'simple' | 'pill' | 'hero';
    link?: string;
  };
}

export type WidgetConfig = 
  | StatConfig 
  | ChartConfig 
  | ClockConfig 
  | IframeConfig 
  | ListConfig 
  | ProgressConfig 
  | StatusConfig
  | LabelConfig;
