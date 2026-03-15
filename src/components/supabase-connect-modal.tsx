"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Shield, Copy, Check, AlertTriangle, CloudRain, ArrowRight, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";
import { encodeCredential, getSupabaseClient } from "@/lib/supabase";
import { LocalStorageAdapter, StorageAdapter } from "@/lib/storage-adapter";
import { SupabaseAdapter } from "@/lib/supabase-adapter";
import { setStorageAdapter } from "@/lib/widgets";

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConnectModal({ isOpen, onClose }: SupabaseConnectModalProps) {
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState<'form' | 'resolve'>('form');
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasRemoteData, setHasRemoteData] = useState(false);
  
  const sqlQuery = `-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widgets
CREATE TABLE IF NOT EXISTS widgets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  after_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget History
CREATE TABLE IF NOT EXISTS widget_data_history (
  widget_id TEXT PRIMARY KEY REFERENCES widgets(id) ON DELETE CASCADE,
  history JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_widgets_workspace_id ON widgets(workspace_id);

-- ENABLE REALTIME
-- Run this to allow the "Realtime Pulse" feature to sync changes instantly!
begin;
  -- remove tables from publication if they exist
  alter publication supabase_realtime drop table if exists workspaces, widgets, app_settings, widget_data_history;
  -- add tables to publication
  alter publication supabase_realtime add table workspaces, widgets, app_settings, widget_data_history;
commit;`;
  const copySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setIsTesting(true);
    setError(null);
    try {
      const client = getSupabaseClient(url, key);
      if (!client) throw new Error("Failed to initialize client");

      // Test connection by trying to fetch settings
      const { data: settingsData, error: connError } = await client.from('app_settings').select('id').limit(1);
      
      if (connError) {
        if (connError.code === '42P01') {
          throw new Error("Tables not found. Please run the SQL query in Supabase first.");
        }
        throw new Error(connError.message);
      }

      // CHECK FOR EXISTING WORKSPACE DATA
      const { data: workspaceData, error: wsError } = await client.from('workspaces').select('id').limit(1);
      if (!wsError && workspaceData && workspaceData.length > 0) {
        setHasRemoteData(true);
      } else {
        setHasRemoteData(false);
      }

      setStep('resolve');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const finalizeConnection = async (mode: 'pull' | 'sync' | 'scratch') => {
    const supabaseConfig = {
      url: encodeCredential(url),
      key: encodeCredential(key),
      isConfigured: true
    };

    // Temporarily set adapter to perform migration actions
    const supabaseAdapter = new SupabaseAdapter();
    const localAdapter = new LocalStorageAdapter();

    if (mode === 'sync') {
      // If remote data exists, we need to clear it first to avoid conflicts
      if (hasRemoteData) {
        const client = getSupabaseClient(url, key);
        if (client) {
          await client.from('workspaces').delete().neq('id', 'placeholder_to_force_delete_all');
        }
      }

      const workspaces = await localAdapter.getWorkspaces();
      for (const ws of workspaces) {
        await supabaseAdapter.saveWorkspace(ws);
        const widgets = await localAdapter.getWidgets(ws.id);
        for (const w of widgets) {
          await supabaseAdapter.saveWidget(w.config, w.afterId, ws.id);
        }
      }
      // Also sync root widgets
      const rootWidgets = await localAdapter.getWidgets(null);
      for (const w of rootWidgets) {
        await supabaseAdapter.saveWidget(w.config, w.afterId, null);
      }
    }

    updateSettings({
      storageType: 'supabase',
      supabaseConfig
    });

    setStorageAdapter(supabaseAdapter);
    onClose();
    window.location.href = window.location.origin;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e]">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Connect to Supabase</h2>
                  <p className="text-xs text-muted font-medium">Cloud storage for your dashboard</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
                <X size={20} className="text-muted" />
              </button>
            </div>

            <div className="p-6">
              {step === 'form' ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-400">
                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
                      <Shield size={14} />
                      Required Database Schema
                    </div>
                    <p className="mb-3 opacity-80">You MUST run this SQL query in your Supabase SQL Editor to enable storage support.</p>
                    <div className="relative group">
                      <pre className="max-h-32 overflow-y-auto rounded bg-black/20 p-3 font-mono text-[10px] leading-relaxed custom-scrollbar selection:bg-primary/30">
                        {sqlQuery}
                      </pre>
                      <button 
                        onClick={copySql}
                        className="absolute right-2 top-2 rounded bg-panel/50 p-1.5 backdrop-blur hover:bg-panel transition-all"
                        title="Copy SQL"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Supabase Project URL</label>
                      <input
                        type="text"
                        placeholder="https://your-project.supabase.co"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full rounded-md border border-border bg-muted/10 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Anon Public Key</label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full rounded-md border border-border bg-muted/10 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-md bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/20">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={isTesting || !url || !key}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#3ecf8e] py-3 text-sm font-bold text-[#1c1c1c] transition-all hover:bg-[#3ecf8e]/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3ecf8e]/20"
                  >
                    {isTesting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1c1c1c]/20 border-t-[#1c1c1c]" />
                    ) : (
                      <Database size={16} fill="currentColor" fillOpacity={0.2} />
                    )}
                    {isTesting ? "Verifying Connection..." : "Check Connection"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] mb-2 ring-8 ring-[#3ecf8e]/5">
                      <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Connected Successfully</h3>
                    <p className="text-sm text-muted">What would you like to do with your data?</p>
                  </div>

                  {hasRemoteData && (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-left">
                      <div className="flex items-center gap-2 text-red-500 mb-2 font-black uppercase tracking-widest text-[10px]">
                        <AlertTriangle size={14} />
                        Data Conflict Detected
                      </div>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed font-bold">
                        You have an existing data stored in your supabase, continue will force to forever delete the current if you have (backup first before preoceeding)
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {hasRemoteData && (
                      <button
                        onClick={() => finalizeConnection('pull')}
                        className="group flex items-center justify-between rounded-xl border border-border bg-muted/10 p-4 text-left transition-all hover:border-[#3ecf8e] hover:bg-[#3ecf8e]/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                            <CloudRain size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Pull from Supabase</div>
                            <div className="text-[10px] text-muted font-medium">Use existing data stored in your database</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-muted group-hover:text-[#3ecf8e] transition-colors" />
                      </button>
                    )}

                    <button
                      onClick={() => finalizeConnection('sync')}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border p-4 text-left transition-all",
                        hasRemoteData 
                          ? "border-red-500/20 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10" 
                          : "border-border bg-muted/10 hover:border-amber-500 hover:bg-amber-500/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                          hasRemoteData ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          <Laptop size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">
                            {hasRemoteData ? "Overwrite Supabase with Local" : "Sync Local to Supabase"}
                          </div>
                          <div className="text-[10px] text-muted font-medium">
                            {hasRemoteData ? "This will delete remote data and push local" : "Upload your current workspaces and widgets"}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={16} className={cn(
                        "text-muted transition-colors",
                        hasRemoteData ? "group-hover:text-red-500" : "group-hover:text-amber-500"
                      )} />
                    </button>

                    <button
                      onClick={() => finalizeConnection('scratch')}
                      className="group flex items-center justify-between rounded-xl border border-border bg-muted/10 p-4 text-left transition-all hover:border-[#3ecf8e] hover:bg-[#3ecf8e]/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
                          <Database size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Start from Scratch</div>
                          <div className="text-[10px] text-muted font-medium">Initialize empty supabase storage</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted group-hover:text-[#3ecf8e] transition-colors" />
                    </button>
                  </div>

                  <p className="text-[10px] text-muted leading-relaxed">
                    Connecting to Supabase will store your workspaces and active widgets in the cloud. 
                    <br />Widget history will continue to reside in your browser's local storage.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
