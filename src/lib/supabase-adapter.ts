import { StorageAdapter } from "./storage-adapter";
import { WidgetConfig } from "@/types/widget";
import { Workspace, TempWidget } from "./widgets";
import { AppSettings } from "@/config/settings";
import { getSupabaseClient } from "./supabase";

import { createClient, RealtimeChannel } from "@supabase/supabase-js";

export class SupabaseAdapter implements StorageAdapter {
  private subscription: RealtimeChannel | null = null;
  private readonly WRITE_GUARD_KEY = 'mrey_last_supabase_write';
  private readonly GUARD_DURATION = 3500; // 3.5s grace period

  private get client() {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client not initialized");
    return client;
  }

  private markLocalWrite() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.WRITE_GUARD_KEY, Date.now().toString());
    }
  }

  private isLocalWrite(): boolean {
    if (typeof window === 'undefined') return false;
    const lastWrite = sessionStorage.getItem(this.WRITE_GUARD_KEY);
    if (!lastWrite) return false;
    return (Date.now() - parseInt(lastWrite)) < this.GUARD_DURATION;
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
    this.markLocalWrite();
  }

  async updateWorkspace(id: string, name: string): Promise<void> {
    const { error } = await this.client
      .from('workspaces')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this.markLocalWrite();
  }

  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await this.client
      .from('workspaces')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this.markLocalWrite();
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
    this.markLocalWrite();
  }

  async deleteWidget(id: string, workspaceId: string | null): Promise<void> {
    // Hard delete from Supabase as requested
    const { error } = await this.client
      .from('widgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this.markLocalWrite();
  }

  async getWidgetHistory(widgetId: string): Promise<{date: string, value: any}[]> {
    try {
      const { data, error } = await this.client
        .from('widget_data_history')
        .select('history')
        .eq('widget_id', widgetId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return []; // Not found
        if (error.code === '42P01') {
          console.warn(`Supabase: table 'widget_data_history' not found. Falling back to local history.`);
          return [];
        }
        throw error;
      }
      return data?.history || [];
    } catch (e: any) {
      if (e.code === '42P01') return [];
      console.error("Failed to fetch widget history", e);
      return [];
    }
  }

  async saveWidgetHistory(widgetId: string, history: {date: string, value: any}[]): Promise<void> {
    try {
      const { error } = await this.client
        .from('widget_data_history')
        .upsert({
          widget_id: widgetId,
          history,
          updated_at: new Date().toISOString()
        });
      if (error) {
        if (error.code === '23503') {
          console.warn(`Widget ${widgetId} not natively found in Supabase yet. History synced to local storage only.`);
          return;
        }
        if (error.code === '42P01') {
          console.warn(`Supabase: table 'widget_data_history' not found. History synced to local storage only.`);
          return;
        }
        throw error;
      }
      this.markLocalWrite();
    } catch (e: any) {
      if (e.code === '42P01') return;
      console.error("Failed to save widget history", e);
    }
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
    this.markLocalWrite();
  }

  onDataChange(callback: () => void, enabled: boolean): void {
    if (!enabled) {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
      return;
    }

    if (this.subscription) return;

    this.subscription = this.client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        (payload: any) => {
          if (this.isLocalWrite()) return;
          console.log("Supabase: Workspace change detected", payload);
          callback();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'widgets' },
        (payload: any) => {
          if (this.isLocalWrite()) return;
          console.log("Supabase: Widget change detected", payload);
          callback();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        (payload: any) => {
          if (this.isLocalWrite()) return;
          console.log("Supabase: Settings change detected", payload);
          callback();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'widget_data_history' },
        (payload: any) => {
          if (this.isLocalWrite()) return;
          console.log("Supabase: History change detected", payload);
          callback();
        }
      )
      .subscribe((status: string) => {
        console.log(`Supabase Realtime Status: ${status}`);
      });
  }
}
