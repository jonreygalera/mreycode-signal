import { appConfig } from "@/config/app";

export interface BackupData {
  version: string;
  exportedAt: string;
  settings: any;
  workspaces: any[];
  widgets: Record<string, any>;
  history: Record<string, any>;
}

export const exportFullBackup = async (onProgress?: (progress: number) => void): Promise<BackupData> => {
  const steps = 4; // settings, workspaces, widgets, history
  let completed = 0;

  const updateProgress = () => {
    completed++;
    if (onProgress) onProgress(Math.floor((completed / steps) * 100));
  };

  const data: BackupData = {
    version: appConfig.version,
    exportedAt: new Date().toISOString(),
    settings: null,
    workspaces: [],
    widgets: {},
    history: {},
  };

  // 1. Settings
  const settings = localStorage.getItem("app-settings");
  data.settings = settings ? JSON.parse(settings) : null;
  updateProgress();

  // 2. Workspaces
  const workspacesRaw = localStorage.getItem("mreycode_signal_workspaces");
  const workspaces = workspacesRaw ? JSON.parse(workspacesRaw) : [];
  data.workspaces = workspaces.map((ws: any, index: number) => ({
    ...ws,
    exportOrder: index // Explicitly track order
  }));
  updateProgress();

  // 3. Widgets (Main + Workspaces)
  const widgetKeys = ["mreycode_signal_temp_widgets"];
  workspaces.forEach((ws: any) => {
    widgetKeys.push(`mreycode_signal_temp_widgets_${ws.id}`);
  });

  widgetKeys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      const widgets = JSON.parse(val);
      data.widgets[key] = widgets.map((w: any, index: number) => ({
        ...w,
        exportOrder: index // Preserve the exact array position
      }));
    }
  });
  updateProgress();

  // 4. History (Main + Workspaces)
  const historyKeys = ["mreycode_signal_widget_history"];
  workspaces.forEach((ws: any) => {
    historyKeys.push(`mreycode_signal_widget_history_${ws.id}`);
  });

  historyKeys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) data.history[key] = JSON.parse(val);
  });
  updateProgress();

  return data;
};

export const importFullBackup = async (
  data: BackupData, 
  options: { settings: boolean; workspaces: boolean; widgets: boolean; history: boolean },
  onProgress?: (progress: number) => void
) => {
  const totalSteps = Object.values(options).filter(Boolean).length;
  let completed = 0;

  const updateProgress = () => {
    completed++;
    if (onProgress) onProgress(Math.floor((completed / totalSteps) * 100));
  };

  if (options.settings && data.settings) {
    localStorage.setItem("app-settings", JSON.stringify(data.settings));
    updateProgress();
  }

  if (options.workspaces) {
    const existingRaw = localStorage.getItem("mreycode_signal_workspaces");
    const existingWorkspaces = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Create a Set of imported IDs for fast filtering
    const importedIds = new Set(data.workspaces.map((ws: any) => ws.id));
    
    // Merge: Prioritize backup order, then append historical workspaces that aren't in backup
    const merged = [
      ...data.workspaces, // Keep backup order
      ...existingWorkspaces.filter((ws: any) => !importedIds.has(ws.id))
    ];
    
    localStorage.setItem("mreycode_signal_workspaces", JSON.stringify(merged));
    updateProgress();
  }

  if (options.widgets) {
    // This will overwrite the widget collection for each workspace (and Main) present in the backup
    Object.entries(data.widgets).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
    updateProgress();
  }

  if (options.history) {
    Object.entries(data.history).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
    updateProgress();
  }
};

