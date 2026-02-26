import { WidgetConfig } from "@/types/widget";

const STORAGE_KEY = "mreycode_signal_temp_widgets";

export interface TempWidget {
  config: WidgetConfig;
  afterId: string | null; // ID after which to insert
}

export const getTempWidgets = (): TempWidget[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveTempWidget = (config: WidgetConfig, afterId: string | null) => {
  const current = getTempWidgets();
  const updated = [...current, { config, afterId }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearTempWidgets = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const mergeWidgets = (baseConfigs: WidgetConfig[], tempWidgets: TempWidget[]): WidgetConfig[] => {
  let result = [...baseConfigs];
  
  // Sort temp widgets to maintain order if they refer to each other or original list
  // For simplicity, we just process them one by one
  tempWidgets.forEach(temp => {
    if (!temp.afterId) {
      result.unshift(temp.config);
      return;
    }
    
    const index = result.findIndex(w => w.id === temp.afterId);
    if (index !== -1) {
      result.splice(index + 1, 0, temp.config);
    } else {
      result.push(temp.config);
    }
  });
  
  return result;
};
