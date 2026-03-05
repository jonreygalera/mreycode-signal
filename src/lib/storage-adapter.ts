import { WidgetConfig } from "@/types/widget";
import { Workspace, TempWidget } from "./widgets";
import { AppSettings } from "@/config/settings";

export interface StorageAdapter {
  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  updateWorkspace(id: string, name: string): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;

  // Widgets (Active only for Supabase)
  getWidgets(workspaceId: string | null): Promise<TempWidget[]>;
  saveWidget(config: WidgetConfig, afterId: string | null, workspaceId: string | null): Promise<void>;
  deleteWidget(id: string, workspaceId: string | null): Promise<void>;

  // Settings
  getSettings(): Promise<Partial<AppSettings>>;
  saveSettings(settings: Partial<AppSettings>): Promise<void>;
}

// LocalStorage Adapter (Legacy / Default)
export class LocalStorageAdapter implements StorageAdapter {
  private STORAGE_KEY_BASE = "mreycode_signal_temp_widgets";
  private WORKSPACES_KEY = "mreycode_signal_workspaces";

  private getStorageKey(workspaceId?: string | null) {
    return workspaceId ? `${this.STORAGE_KEY_BASE}_${workspaceId}` : this.STORAGE_KEY_BASE;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const stored = localStorage.getItem(this.WORKSPACES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const current = await this.getWorkspaces();
    localStorage.setItem(this.WORKSPACES_KEY, JSON.stringify([...current, workspace]));
  }

  async updateWorkspace(id: string, name: string): Promise<void> {
    const current = await this.getWorkspaces();
    const updated = current.map(ws => ws.id === id ? { ...ws, name } : ws);
    localStorage.setItem(this.WORKSPACES_KEY, JSON.stringify(updated));
  }

  async deleteWorkspace(id: string): Promise<void> {
    const current = await this.getWorkspaces();
    localStorage.setItem(this.WORKSPACES_KEY, JSON.stringify(current.filter(ws => ws.id !== id)));
    localStorage.removeItem(this.getStorageKey(id));
  }

  async getWidgets(workspaceId: string | null): Promise<TempWidget[]> {
    const stored = localStorage.getItem(this.getStorageKey(workspaceId));
    return stored ? JSON.parse(stored) : [];
  }

  async saveWidget(config: WidgetConfig, afterId: string | null, workspaceId: string | null): Promise<void> {
    const current = await this.getWidgets(workspaceId);
    const existingIndex = current.findIndex(w => w.config.id === config.id);
    let updated;
    if (existingIndex !== -1) {
      updated = [...current];
      updated[existingIndex] = { config, afterId };
    } else {
      updated = [...current, { config, afterId }];
    }
    localStorage.setItem(this.getStorageKey(workspaceId), JSON.stringify(updated));
  }

  async deleteWidget(id: string, workspaceId: string | null): Promise<void> {
    const current = await this.getWidgets(workspaceId);
    const updated = current.filter(w => w.config.id !== id);
    localStorage.setItem(this.getStorageKey(workspaceId), JSON.stringify(updated));
  }

  async getSettings(): Promise<Partial<AppSettings>> {
    const stored = localStorage.getItem("app-settings");
    return stored ? JSON.parse(stored) : {};
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    localStorage.setItem("app-settings", JSON.stringify({ ...current, ...settings }));
  }
}
