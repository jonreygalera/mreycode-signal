export type SignalCondition = 'above' | 'below' | 'equals' | 'diff';
export type SignalAction = 'notify' | 'pulse' | 'sound' | 'notify-in-app';

export interface SignalConfig {
  id: string;
  label: string;
  condition: SignalCondition;
  threshold: number;
  action: SignalAction[];
  enabled: boolean;
  cooldown?: number; // Minutes to wait before re-triggering
  duration?: number; // Seconds for in-app notification
}

export interface ActiveSignal {
  widgetId: string;
  signalId: string;
  timestamp: number;
  value: number;
}
