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
  const existingIndex = current.findIndex(w => w.config.id === config.id);
  
  let updated;
  if (existingIndex !== -1) {
    updated = [...current];
    updated[existingIndex] = { config, afterId };
  } else {
    updated = [...current, { config, afterId }];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

const HISTORY_KEY = "mreycode_signal_widget_history";

export const getHistoryWidgets = (): TempWidget[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const deleteTempWidget = (id: string, permanently = false) => {
  const current = getTempWidgets();
  const widgetToDelete = current.find(w => w.config.id === id);
  
  if (!widgetToDelete) return;

  // Remove from current
  const updated = current.filter(w => w.config.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Add to history if not permanent
  if (!permanently) {
    const history = getHistoryWidgets();
    if (!history.find(w => w.config.id === id)) {
      const updatedHistory = [widgetToDelete, ...history];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    }
  }
};

export const restoreWidgetFromHistory = (id: string) => {
  const history = getHistoryWidgets();
  const widgetToRestore = history.find(w => w.config.id === id);
  
  if (!widgetToRestore) return;

  // Remove from history
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

  // Add back to temp
  saveTempWidget(widgetToRestore.config, widgetToRestore.afterId);
};

export const permadeleteFromHistory = (id: string) => {
  const history = getHistoryWidgets();
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const restoreAllHistory = () => {
  const history = getHistoryWidgets();
  history.forEach(w => saveTempWidget(w.config, w.afterId));
  localStorage.removeItem(HISTORY_KEY);
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const mergeWidgets = (baseConfigs: WidgetConfig[], tempWidgets: TempWidget[]): WidgetConfig[] => {
  let result = [...baseConfigs];
  
  // Sort temp widgets to maintain order if they refer to each other or original list
  // For simplicity, we just process them one by one
  tempWidgets.forEach(temp => {
    const configWithFlag = { ...temp.config, isTemp: true };
    
    if (!temp.afterId) {
      result.unshift(configWithFlag);
      return;
    }
    
    const index = result.findIndex(w => w.id === temp.afterId);
    if (index !== -1) {
      result.splice(index + 1, 0, configWithFlag);
    } else {
      result.push(configWithFlag);
    }
  });
  
  return result;
};
