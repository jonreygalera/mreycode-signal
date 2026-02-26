import { WidgetConfig } from "@/types/widget";

export function getStatusColor(
  value: number | string | undefined, 
  config: WidgetConfig
): 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info' | undefined {
  if (config.color) return config.color;
  if (!config.colorRules) return undefined;

  const num = typeof value === 'number' ? value : Number(value);
  
  if (isNaN(num)) return undefined;

  const { aboveZero, belowZero, atZero, rules } = config.colorRules;

  // 1. Process custom high-priority rules first
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      if (rule.condition === 'above' && num > rule.value) return rule.color;
      if (rule.condition === 'below' && num < rule.value) return rule.color;
      if (rule.condition === 'at' && num === rule.value) return rule.color;
    }
  }

  // 2. Fallback to simple zero-based rules
  if (num > 0 && aboveZero) return aboveZero;
  if (num < 0 && belowZero) return belowZero;
  if (num === 0 && atZero) return atZero;

  return undefined;
}
