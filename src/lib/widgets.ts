import { WidgetConfig } from "@/types/widget";
import { LocalStorageAdapter, StorageAdapter } from "./storage-adapter";
import { SupabaseAdapter } from "./supabase-adapter";

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

let currentAdapter: StorageAdapter = new LocalStorageAdapter();

export const setStorageAdapter = (adapter: StorageAdapter) => {
  currentAdapter = adapter;
};

export const getStorageAdapter = () => currentAdapter;

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
  // Legacy sync version for components that haven't been migrated yet
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

export const getTempWidgetsAsync = async (workspaceId?: string | null): Promise<TempWidget[]> => {
  try {
    const widgets = await currentAdapter.getWidgets(workspaceId ?? null);
    return widgets.map(tw => ({
      ...tw,
      config: migrateWidgetConfig(tw.config)
    }));
  } catch (e) {
    console.error("Failed to fetch widgets", e);
    return getTempWidgets(workspaceId); // Fallback to local
  }
};

export const saveTempWidget = async (config: WidgetConfig, afterId: string | null, workspaceId?: string | null) => {
  await currentAdapter.saveWidget(config, afterId, workspaceId || null);
};

export const getHistoryWidgets = (workspaceId?: string | null): TempWidget[] => {
  // History ALWAYS stays in localStorage as per user requirement
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

export const deleteTempWidget = async (id: string, workspaceId?: string | null, permanently = false) => {
  const current = await getTempWidgetsAsync(workspaceId || null);
  const widgetToDelete = current.find(w => w.config.id === id);
  
  if (!widgetToDelete) return;

  // Remove from Supabase/Local active storage
  await currentAdapter.deleteWidget(id, workspaceId || null);

  // Add to history if not permanent (History stays in LocalStorage)
  if (!permanently) {
    const history = getHistoryWidgets(workspaceId);
    if (!history.find(w => w.config.id === id)) {
      const updatedHistory = [widgetToDelete, ...history];
      localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));
    }
  }
};

export const restoreWidgetFromHistory = async (id: string, workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  const widgetToRestore = history.find(w => w.config.id === id);
  
  if (!widgetToRestore) return;

  // Remove from history (LocalStorage)
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));

  // Add back to active storage (Supabase/Local)
  await saveTempWidget(widgetToRestore.config, widgetToRestore.afterId, workspaceId);
};

export const permadeleteFromHistory = (id: string, workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  const updatedHistory = history.filter(w => w.config.id !== id);
  localStorage.setItem(getHistoryKey(workspaceId), JSON.stringify(updatedHistory));
};

export const restoreAllHistory = async (workspaceId?: string | null) => {
  const history = getHistoryWidgets(workspaceId);
  for (const w of history) {
    await saveTempWidget(w.config, w.afterId, workspaceId);
  }
  localStorage.removeItem(getHistoryKey(workspaceId));
};

export const clearHistory = (workspaceId?: string | null) => {
  localStorage.removeItem(getHistoryKey(workspaceId));
};

export const clearAllHistory = () => {
  // We need workspaces to clear all history
  const stored = localStorage.getItem(WORKSPACES_KEY);
  const workspaces: Workspace[] = stored ? JSON.parse(stored) : [];
  
  localStorage.removeItem(getHistoryKey(null));
  workspaces.forEach(ws => localStorage.removeItem(getHistoryKey(ws.id)));
};

export const getWorkspaces = (): Workspace[] => {
  // Legacy sync version
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(WORKSPACES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const getWorkspacesAsync = async (): Promise<Workspace[]> => {
  try {
    return await currentAdapter.getWorkspaces();
  } catch (e) {
    console.error("Failed to fetch workspaces", e);
    return getWorkspaces();
  }
};

export const saveWorkspace = async (workspace: Workspace) => {
  const current = await getWorkspacesAsync();
  if (current.some(ws => ws.name.toLowerCase() === workspace.name.toLowerCase())) {
    throw new Error(`A workspace with the name "${workspace.name}" already exists.`);
  }
  await currentAdapter.saveWorkspace(workspace);
};

export const updateWorkspace = async (id: string, name: string) => {
  const current = await getWorkspacesAsync();
  if (current.some(ws => ws.id !== id && ws.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A workspace with the name "${name}" already exists.`);
  }
  await currentAdapter.updateWorkspace(id, name);
};

export const duplicateWorkspace = async (sourceId: string | null, newWorkspace: Workspace) => {
  await saveWorkspace(newWorkspace);
  const sourceWidgets = await getTempWidgetsAsync(sourceId);
  // Copy widgets to new workspace
  for (const sw of sourceWidgets) {
    await saveTempWidget(sw.config, sw.afterId, newWorkspace.id);
  }
};

export const deleteWorkspace = async (id: string) => {
  await currentAdapter.deleteWorkspace(id);
};

export const mergeWidgets = (baseConfigs: WidgetConfig[], tempWidgets: TempWidget[]): WidgetConfig[] => {
  let result = [...baseConfigs];
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

export const getGlobalStats = async () => {
  const workspaces = await getWorkspacesAsync();
  let activeWidgetsCount = 0;
  let historyWidgetsCount = 0;

  // Root widgets
  const rootWidgets = await getTempWidgetsAsync(null);
  activeWidgetsCount += rootWidgets.length;
  
  const rootHistory = getHistoryWidgets(null);
  historyWidgetsCount += rootHistory.length;

  for (const ws of workspaces) {
    const widgets = await getTempWidgetsAsync(ws.id);
    activeWidgetsCount += widgets.length;
    
    const history = getHistoryWidgets(ws.id);
    historyWidgetsCount += history.length;
  }

  return {
    workspacesCount: workspaces.length,
    activeWidgetsCount,
    historyWidgetsCount
  };
};
