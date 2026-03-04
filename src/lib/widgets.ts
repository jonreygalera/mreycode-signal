import { WidgetConfig } from "@/types/widget";

export interface TempWidget {
  config: WidgetConfig;
  afterId: string | null; // ID after which to insert
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY_BASE = "mreycode_signal_temp_widgets";
const HISTORY_KEY_BASE = "mreycode_signal_widget_history";
const WORKSPACES_KEY = "mreycode_signal_workspaces";

export const MAX_WIDGETS_PER_WORKSPACE = 12;

const getStorageKey = (workspaceId?: string | null) => 
  workspaceId ? `${STORAGE_KEY_BASE}_${workspaceId}` : STORAGE_KEY_BASE;

const getHistoryKey = (workspaceId?: string | null) => 
  workspaceId ? `${HISTORY_KEY_BASE}_${workspaceId}` : HISTORY_KEY_BASE;

const migrateWidgetConfig = (oldConfig: any): WidgetConfig => {
  if (oldConfig.config) return oldConfig as WidgetConfig;

  const {
    type,
    displayType,
    timezone,
    iframeUrl,
    xKey,
    yKey,
    prefix,
    suffix,
    abbreviate,
    ...base
  } = oldConfig;

  let newConfig: any = { ...base };

  if (type === 'line' || type === 'bar' || type === 'area') {
    newConfig.type = 'chart';
    newConfig.config = {
      chart: type,
      xKey: xKey || '',
      yKey: yKey || '',
      prefix,
      suffix,
    };
  } else if (type === 'stat') {
    newConfig.type = 'stat';
    newConfig.config = {
      prefix,
      suffix,
      abbreviate,
    };
  } else if (type === 'clock') {
    newConfig.type = 'clock';
    newConfig.config = {
      displayType: displayType || 'digital',
      timezone,
    };
  } else if (type === 'iframe') {
    newConfig.type = 'iframe';
    newConfig.config = {
      iframeUrl,
    };
  } else {
    newConfig.type = type;
    newConfig.config = {};
  }

  return newConfig as WidgetConfig;
};

export const getTempWidgets = (workspaceId?: string | null): TempWidget[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(getStorageKey(workspaceId));
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((tw: any) => ({
      ...tw,
      config: migrateWidgetConfig(tw.config)
    }));
  } catch (e) {
    return [];
  }
};

export const saveTempWidget = (config: WidgetConfig, afterId: string | null, workspaceId?: string | null) => {
  const current = getTempWidgets(workspaceId);
  const existingIndex = current.findIndex(w => w.config.id === config.id);
  
  /* 
  if (existingIndex === -1 && current.length >= MAX_WIDGETS_PER_WORKSPACE) {
    throw new Error(`Maximum of ${MAX_WIDGETS_PER_WORKSPACE} widgets allowed per workspace.`);
  }
  */

  let updated;
  if (existingIndex !== -1) {
    updated = [...current];
    updated[existingIndex] = { config, afterId };
  } else {
    updated = [...current, { config, afterId }];
  }
  
  localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(updated));
};

export const getHistoryWidgets = (workspaceId?: string | null): TempWidget[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(getHistoryKey(workspaceId));
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((tw: any) => ({
      ...tw,
      config: migrateWidgetConfig(tw.config)
    }));
  } catch (e) {
    return [];
  }
};

export const deleteTempWidget = (id: string, workspaceId?: string | null, permanently = false) => {
  const current = getTempWidgets(workspaceId);
  const widgetToDelete = current.find(w => w.config.id === id);
  
  if (!widgetToDelete) return;

  // Remove from current
  const updated = current.filter(w => w.config.id !== id);
  localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(updated));

  // Add to history if not permanent
  if (!permanently) {
    const history = getHistoryWidgets(workspaceId);
    if (!history.find(w => w.config.id === id)) {
      const updatedHistory = [widgetToDelete, ...history];
      localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));
    }
  }
};

export const restoreWidgetFromHistory = (id: string, workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  const widgetToRestore = history.find(w => w.config.id === id);
  
  if (!widgetToRestore) return;

  // Remove from history
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));

  // Add back to temp
  saveTempWidget(widgetToRestore.config, widgetToRestore.afterId, workspaceId);
};

export const permadeleteFromHistory = (id: string, workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));
};

export const restoreAllHistory = (workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  history.forEach(w => saveTempWidget(w.config, w.afterId, workspaceId));
  localStorage.removeItem(getHistoryKey(workspaceId));
};

export const clearHistory = (workspaceId?: string | null) => {
  localStorage.removeItem(getHistoryKey(workspaceId));
};

export const clearAllHistory = () => {
  const workspaces = getWorkspaces();
  // Clear root history
  localStorage.removeItem(getHistoryKey(null));
  // Clear each workspace history
  workspaces.forEach(ws => localStorage.removeItem(getHistoryKey(ws.id)));
};

export const getGlobalStats = () => {
  const workspaces = getWorkspaces();
  let totalActive = 0;
  let totalHistory = 0;

  // Root stats (if any)
  totalActive += getTempWidgets(null).length;
  totalHistory += getHistoryWidgets(null).length;

  // Workspace stats
  workspaces.forEach(ws => {
    totalActive += getTempWidgets(ws.id).length;
    totalHistory += getHistoryWidgets(ws.id).length;
  });

  return {
    workspacesCount: workspaces.length,
    activeWidgetsCount: totalActive,
    historyWidgetsCount: totalHistory
  };
};

export const getWorkspaces = (): Workspace[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(WORKSPACES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveWorkspace = (workspace: Workspace) => {
  const current = getWorkspaces();
  
  /* 
  if (current.length >= MAX_WORKSPACES) {
    throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed.`);
  }
  */

  if (current.some(ws => ws.name.toLowerCase() === workspace.name.toLowerCase())) {
    throw new Error(`A workspace with the name "${workspace.name}" already exists.`);
  }

  const updated = [...current, workspace];
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
};

export const updateWorkspace = (id: string, name: string) => {
  const current = getWorkspaces();
  
  if (current.some(ws => ws.id !== id && ws.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A workspace with the name "${name}" already exists.`);
  }

  const updated = current.map(ws => ws.id === id ? { ...ws, name } : ws);
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
};

export const duplicateWorkspace = (sourceId: string | null, newWorkspace: Workspace) => {
  // Save the new workspace first (checks limits and uniqueness)
  saveWorkspace(newWorkspace);
  
  // Copy widgets
  const sourceWidgets = getTempWidgets(sourceId);
  const sourceHistory = getHistoryWidgets(sourceId);
  
  localStorage.setItem(getStorageKey(newWorkspace.id), JSON.stringify(sourceWidgets));
  localStorage.setItem(getHistoryKey(newWorkspace.id), JSON.stringify(sourceHistory));
};

export const deleteWorkspace = (id: string) => {
  const current = getWorkspaces();
  const updated = current.filter(ws => ws.id !== id);
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
  
  // Clean up associated storage
  localStorage.removeItem(getStorageKey(id));
  localStorage.removeItem(getHistoryKey(id));
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
