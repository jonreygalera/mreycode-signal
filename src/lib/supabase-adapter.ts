import { StorageAdapter } from "./storage-adapter";
import { WidgetConfig } from "@/types/widget";
import { Workspace, TempWidget } from "./widgets";
import { AppSettings } from "@/config/settings";
import { getSupabaseClient } from "./supabase";

export class SupabaseAdapter implements StorageAdapter {
  private get client() {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client not initialized");
    return client;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await this.client
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data.map((ws: any) => ({
      id: ws.id,
      name: ws.name,
      createdAt: parseInt(ws.created_at)
    }));
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const { error } = await this.client
      .from('workspaces')
      .insert({
        id: workspace.id,
        name: workspace.name,
        created_at: workspace.createdAt
      });
    if (error) throw error;
  }

  async updateWorkspace(id: string, name: string): Promise<void> {
    const { error } = await this.client
      .from('workspaces')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await this.client
      .from('workspaces')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getWidgets(workspaceId: string | null): Promise<TempWidget[]> {
    const query = this.client
      .from('widgets')
      .select('*');
    
    if (workspaceId) {
      query.eq('workspace_id', workspaceId);
    } else {
      query.is('workspace_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((w: any) => ({
      config: w.config,
      afterId: w.after_id
    }));
  }

  async saveWidget(config: WidgetConfig, afterId: string | null, workspaceId: string | null): Promise<void> {
    const { error } = await this.client
      .from('widgets')
      .upsert({
        id: config.id,
        workspace_id: workspaceId,
        config,
        after_id: afterId,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
  }

  async deleteWidget(id: string, workspaceId: string | null): Promise<void> {
    // Hard delete from Supabase as requested
    const { error } = await this.client
      .from('widgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getSettings(): Promise<Partial<AppSettings>> {
    const { data, error } = await this.client
      .from('app_settings')
      .select('value')
      .eq('id', 'default')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data?.value || {};
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const { error } = await this.client
      .from('app_settings')
      .upsert({
        id: 'default',
        value: settings,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
  }
}
