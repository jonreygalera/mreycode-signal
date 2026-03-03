export type SignalCondition = 'above' | 'below' | 'equals' | 'diff';
export type SignalAction = 'notify' | 'pulse' | 'sound';

export interface SignalConfig {
  id: string;
  label: string;
  condition: SignalCondition;
  threshold: number;
  action: SignalAction[];
  enabled: boolean;
  cooldown?: number; // Minutes to wait before re-triggering
}

export interface ActiveSignal {
  widgetId: string;
  signalId: string;
  timestamp: number;
  value: number;
}
