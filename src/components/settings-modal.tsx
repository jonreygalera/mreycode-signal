"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Image as ImageIcon, RotateCcw, Save, Trash2, Check, Upload, Search, Type, ChevronDown, Download, LayoutDashboard, Database, Settings as SettingsIcon, AlertCircle, RefreshCcw, HardDrive, Info, Wifi, Bot } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { useAlert } from "@/context/alert-context";
import { exportFullBackup, importFullBackup, BackupData } from "@/lib/backup-utils";
import { appConfig } from "@/config/app";

import { DEFAULT_SETTINGS } from "@/config/settings";
import { cn } from "@/lib/utils";
import { getStorageUsage } from "@/lib/storage-utils";
import { ThemeToggle } from "./theme-toggle";
import { AI_PROVIDERS, AI_MODELS, getDefaultModel, AiProviderId } from "@/config/ai";
import { SupabaseConnectModal } from "./supabase-connect-modal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { showAlert } = useAlert();

  const [localTimezone, setLocalTimezone] = useState(settings.timezone);
  const [localBgImage, setLocalBgImage] = useState(settings.backgroundImage);
  const [localUseBgInClock, setLocalUseBgInClock] = useState(settings.useBgInClock);
  const [localTvCarouselEnabled, setLocalTvCarouselEnabled] = useState(settings.tvCarouselEnabled);
  const [localTvCarouselInterval, setLocalTvCarouselInterval] = useState(settings.tvCarouselInterval);
  const [localMaximizedCarouselEnabled, setLocalMaximizedCarouselEnabled] = useState(settings.maximizedCarouselEnabled);
  const [localMaximizedCarouselInterval, setLocalMaximizedCarouselInterval] = useState(settings.maximizedCarouselInterval);
  const [localSnackbarPosition, setLocalSnackbarPosition] = useState(settings.snackbarPosition);
  const [localLocalStorageThreshold, setLocalLocalStorageThreshold] = useState(settings.localStorageThreshold);
  const [localMaxWorkspaces, setLocalMaxWorkspaces] = useState(settings.maxWorkspaces);
  const [localMaxWidgetsPerWorkspace, setLocalMaxWidgetsPerWorkspace] = useState(settings.maxWidgetsPerWorkspace);
  const [localConnectivityUrl, setLocalConnectivityUrl] = useState(settings.connectivityUrl);
  const [localConnectivityEvery, setLocalConnectivityEvery] = useState(settings.connectivityEvery);
  const [localConnectivityMode, setLocalConnectivityMode] = useState(settings.connectivityMode);
  const [localConnectivityThresholdExcellent, setLocalConnectivityThresholdExcellent] = useState(settings.connectivityThresholdExcellent);
  const [localConnectivityThresholdGood, setLocalConnectivityThresholdGood] = useState(settings.connectivityThresholdGood);
  const [localConnectivityThresholdAverage, setLocalConnectivityThresholdAverage] = useState(settings.connectivityThresholdAverage);
  const [localConnectivityThresholdSlow, setLocalConnectivityThresholdSlow] = useState(settings.connectivityThresholdSlow);
  const [localAiProvider, setLocalAiProvider] = useState(settings.aiProvider);
  const [localAiModel, setLocalAiModel] = useState(settings.aiModel);
  const [localAiApiKey, setLocalAiApiKey] = useState(settings.aiApiKey);
  const [localAiCustomUrl, setLocalAiCustomUrl] = useState(settings.aiCustomUrl);
  const [localAiCustomHeaders, setLocalAiCustomHeaders] = useState(settings.aiCustomHeaders);
  const [localAiCustomBody, setLocalAiCustomBody] = useState(settings.aiCustomBody);
  const [previewImage, setPreviewImage] = useState<string | null>(settings.backgroundImage);
  const [storageStatus, setStorageStatus] = useState(getStorageUsage());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [tzSearch, setTzSearch] = useState("");
  const [isTzOpen, setIsTzOpen] = useState(false);
  const tzDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Backup/Restore State
  const [backupStatus, setBackupStatus] = useState<'idle' | 'exporting' | 'import_preview' | 'importing'>('idle');
  const [backupProgress, setBackupProgress] = useState(0);
  const [importFileData, setImportFileData] = useState<BackupData | null>(null);
  const [backupSelection, setBackupSelection] = useState({
    settings: true,
    workspaces: true,
    widgets: true,
    history: true
  });
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // @ts-ignore - Intl.supportedValuesOf might not be in the TS types yet but supported in modern browsers
      const allTimezones = Intl.supportedValuesOf("timeZone");
      setTimezones(allTimezones);
    } catch (e) {
      setTimezones(["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]);
    }
  }, []);

  useEffect(() => {
    setLocalTimezone(settings.timezone);
    setLocalBgImage(settings.backgroundImage);
    setLocalUseBgInClock(settings.useBgInClock);
    setLocalTvCarouselEnabled(settings.tvCarouselEnabled);
    setLocalTvCarouselInterval(settings.tvCarouselInterval);
    setLocalMaximizedCarouselEnabled(settings.maximizedCarouselEnabled);
    setLocalMaximizedCarouselInterval(settings.maximizedCarouselInterval);
    setLocalSnackbarPosition(settings.snackbarPosition);
    setLocalLocalStorageThreshold(settings.localStorageThreshold);
    setLocalMaxWidgetsPerWorkspace(settings.maxWidgetsPerWorkspace);
    setLocalConnectivityUrl(settings.connectivityUrl);
    setLocalConnectivityEvery(settings.connectivityEvery);
    setLocalConnectivityMode(settings.connectivityMode);
    setLocalConnectivityThresholdExcellent(settings.connectivityThresholdExcellent);
    setLocalConnectivityThresholdGood(settings.connectivityThresholdGood);
    setLocalConnectivityThresholdAverage(settings.connectivityThresholdAverage);
    setLocalConnectivityThresholdSlow(settings.connectivityThresholdSlow);
    setLocalAiProvider(settings.aiProvider);
    setLocalAiModel(settings.aiModel);
    setLocalAiApiKey(settings.aiApiKey);
    setLocalAiCustomUrl(settings.aiCustomUrl);
    setLocalAiCustomHeaders(settings.aiCustomHeaders);
    setLocalAiCustomBody(settings.aiCustomBody);
    setPreviewImage(settings.backgroundImage);
    setStorageStatus(getStorageUsage());
  }, [settings, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tzDropdownRef.current && !tzDropdownRef.current.contains(event.target as Node)) {
        setIsTzOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert({
          title: "File Too Large",
          message: "Image size should be less than 2MB for local storage performance.",
          type: "warning"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setLocalBgImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings({
      timezone: localTimezone,
      backgroundImage: localBgImage,
      useBgInClock: localUseBgInClock,
      tvCarouselEnabled: localTvCarouselEnabled,
      tvCarouselInterval: Math.max(30, localTvCarouselInterval),
      maximizedCarouselEnabled: localMaximizedCarouselEnabled,
      maximizedCarouselInterval: Math.max(20, localMaximizedCarouselInterval),
      snackbarPosition: localSnackbarPosition,
      localStorageThreshold: localLocalStorageThreshold,
      maxWorkspaces: localMaxWorkspaces,
      maxWidgetsPerWorkspace: localMaxWidgetsPerWorkspace,
      connectivityUrl: localConnectivityUrl,
      connectivityEvery: Math.max(5, localConnectivityEvery),
      connectivityMode: localConnectivityMode,
      connectivityThresholdExcellent: localConnectivityThresholdExcellent,
      connectivityThresholdGood: localConnectivityThresholdGood,
      connectivityThresholdAverage: localConnectivityThresholdAverage,
      connectivityThresholdSlow: localConnectivityThresholdSlow,
      aiProvider: localAiProvider,
      aiModel: localAiModel,
      aiApiKey: localAiApiKey,
      aiCustomUrl: localAiCustomUrl,
      aiCustomHeaders: localAiCustomHeaders,
      aiCustomBody: localAiCustomBody,
    });
    onClose();
  };

  const handleReset = async () => {
    const confirmed = await showAlert({
      title: "Reset Settings",
      message: "Are you sure you want to reset all settings to default? This will clear your custom background and timezone.",
      type: "warning",
      showCancel: true,
      confirmText: "Reset Everything",
      cancelText: "Keep My Settings"
    });

    if (confirmed) {
      resetSettings();
      setLocalTimezone(DEFAULT_SETTINGS.timezone);
      setLocalBgImage(DEFAULT_SETTINGS.backgroundImage);
      setLocalUseBgInClock(DEFAULT_SETTINGS.useBgInClock);
      setLocalTvCarouselEnabled(DEFAULT_SETTINGS.tvCarouselEnabled);
      setLocalTvCarouselInterval(DEFAULT_SETTINGS.tvCarouselInterval);
      setLocalMaximizedCarouselEnabled(DEFAULT_SETTINGS.maximizedCarouselEnabled);
      setLocalMaximizedCarouselInterval(DEFAULT_SETTINGS.maximizedCarouselInterval);
      setLocalSnackbarPosition(DEFAULT_SETTINGS.snackbarPosition);
      setLocalLocalStorageThreshold(DEFAULT_SETTINGS.localStorageThreshold);
      setLocalMaxWorkspaces(DEFAULT_SETTINGS.maxWorkspaces);
      setLocalMaxWidgetsPerWorkspace(DEFAULT_SETTINGS.maxWidgetsPerWorkspace);
      setLocalConnectivityUrl(DEFAULT_SETTINGS.connectivityUrl);
      setLocalConnectivityEvery(DEFAULT_SETTINGS.connectivityEvery);
      setLocalConnectivityMode(DEFAULT_SETTINGS.connectivityMode);
      setLocalConnectivityThresholdExcellent(DEFAULT_SETTINGS.connectivityThresholdExcellent);
      setLocalConnectivityThresholdGood(DEFAULT_SETTINGS.connectivityThresholdGood);
      setLocalConnectivityThresholdAverage(DEFAULT_SETTINGS.connectivityThresholdAverage);
      setLocalConnectivityThresholdSlow(DEFAULT_SETTINGS.connectivityThresholdSlow);
      setLocalAiProvider(DEFAULT_SETTINGS.aiProvider);
      setLocalAiModel(DEFAULT_SETTINGS.aiModel);
      setLocalAiApiKey(DEFAULT_SETTINGS.aiApiKey);
      setLocalAiCustomUrl(DEFAULT_SETTINGS.aiCustomUrl);
      setLocalAiCustomHeaders(DEFAULT_SETTINGS.aiCustomHeaders);
      setLocalAiCustomBody(DEFAULT_SETTINGS.aiCustomBody);
      setPreviewImage(DEFAULT_SETTINGS.backgroundImage);
    }
  };

  const removeImage = () => {
    setLocalBgImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFullExport = async () => {
    setBackupStatus('exporting');
    setBackupProgress(0);
    
    // Slight delay to show the progress starting
    await new Promise(r => setTimeout(r, 600));

    const data = await exportFullBackup((p) => setBackupProgress(p));
    
    // Filter based on selection
    const filteredData: Partial<BackupData> = {
      version: data.version,
      exportedAt: data.exportedAt
    };
    if (backupSelection.settings) filteredData.settings = data.settings;
    if (backupSelection.workspaces) filteredData.workspaces = data.workspaces;
    if (backupSelection.widgets) filteredData.widgets = data.widgets;
    if (backupSelection.history) filteredData.history = data.history;

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `mreycode-signal-full-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setBackupProgress(100);
    setTimeout(() => {
      setBackupStatus('idle');
      setBackupProgress(0);
    }, 1000);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version) throw new Error("Invalid backup file: Missing version");
        setImportFileData(data);
        setBackupStatus('import_preview');
      } catch (err: any) {
        showAlert({ title: "Import Error", message: err.message, type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFullImport = async () => {
    if (!importFileData) return;

    const confirmed = await showAlert({
      title: "Confirm Master Import",
      message: "This will overwrite your current configuration for the selected items. Do you want to proceed?",
      type: "warning",
      showCancel: true,
      confirmText: "Yes, Overwrite",
      cancelText: "Stop"
    });

    if (!confirmed) return;

    setBackupStatus('importing');
    setBackupProgress(0);
    
    await new Promise(r => setTimeout(r, 800));

    await importFullBackup(importFileData, backupSelection, (p) => setBackupProgress(p));

    setBackupProgress(100);
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 1000);
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full h-full sm:h-[90vh] sm:max-w-5xl flex flex-col bg-panel border-y sm:border border-border sm:rounded-3xl shadow-2xl overflow-hidden max-h-screen"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-foreground text-background rounded-xl">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight uppercase">App Settings</h2>
                  <p className="text-xs text-muted/60 font-medium">Personalize your dashboard experience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-muted/10 rounded-full transition-all text-muted hover:text-foreground active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10">
              {/* Storage Section - MOVED TO TOP FOR VISIBILITY */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Cloud & Storage</h3>
                </div>
                
                <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/5 p-6">
                  {/* Subtle decorative background */}
                  <div className="absolute -right-8 -top-8 text-primary/5 rotate-12 pointer-events-none">
                    <Database size={120} />
                  </div>

                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-foreground">Storage Engine</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          settings.storageType === 'supabase' 
                            ? "bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20" 
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}>
                          {settings.storageType === 'supabase' ? 'Supabase Active' : 'Local Instance'}
                        </span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed max-w-xl">
                        {settings.storageType === 'supabase' 
                          ? "Your configuration and workspaces are currently synchronized with your private Supabase cloud instance."
                          : "Your data is currently stored only in this browser. Connect to Supabase to enable multi-device synchronization and cloud backups."}
                      </p>
                    </div>

                    <div className="flex shrink-0">
                      {settings.storageType === 'supabase' ? (
                        <button
                          onClick={() => setIsSupabaseModalOpen(true)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-panel border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 shadow-sm"
                        >
                          <SettingsIcon size={14} />
                          Manage Cloud
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsSupabaseModalOpen(true)}
                          className="group relative flex items-center gap-3 px-8 py-4 rounded-xl bg-[#3ecf8e] text-[#1c1c1c] text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-[#3ecf8e]/20 active:scale-95 overflow-hidden border-none"
                        >
                          <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                          <Database size={16} fill="currentColor" fillOpacity={0.2} />
                          Connect Supabase
                        </button>
                      )}
                    </div>
                  </div>

                  {settings.storageType === 'supabase' && (
                    <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Realtime Pulse</span>
                            <span className="px-1.5 py-0.5 bg-[#3ecf8e]/10 text-[#3ecf8e] text-[8px] font-bold rounded uppercase">Beta</span>
                          </div>
                          <p className="text-[10px] text-muted max-w-[280px]">
                            Automatically sync changes from other devices without refreshing.
                          </p>
                          <div className="mt-2 text-[9px] bg-blue-500/5 text-blue-500/80 border border-blue-500/10 rounded-md p-2 flex items-start gap-2">
                             <Info size={12} className="shrink-0 mt-0.5" />
                             <p className="leading-relaxed">
                               Prerequisite: You must enable **Realtime** on your Supabase tables. Click <strong>Manage Cloud</strong> to copy the updated SQL script.
                             </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={settings.supabaseRealtimeEnabled}
                            onChange={(e) => updateSettings({ supabaseRealtimeEnabled: e.target.checked })}
                          />
                          <div className="w-10 h-5 bg-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ecf8e]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between group pt-4 border-t border-border/30">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Workspace Limit</span>
                          <p className="text-[10px] text-muted max-w-[280px]">
                            Maximum number of workspaces allowed in cloud sync.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={localMaxWorkspaces}
                            onChange={(e) => setLocalMaxWorkspaces(parseInt(e.target.value))}
                            className="w-24 accent-[#3ecf8e]"
                          />
                          <span className="text-[10px] font-mono font-bold bg-muted/20 px-2 py-1 rounded min-w-[20px] text-center">
                            {localMaxWorkspaces}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between group pt-4 border-t border-border/30">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Widget Limit</span>
                          <p className="text-[10px] text-muted max-w-[280px]">
                            Maximum widgets allowed per workspace in cloud sync.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={localMaxWidgetsPerWorkspace}
                            onChange={(e) => setLocalMaxWidgetsPerWorkspace(parseInt(e.target.value))}
                            className="w-24 accent-[#3ecf8e]"
                          />
                          <span className="text-[10px] font-mono font-bold bg-muted/20 px-2 py-1 rounded min-w-[20px] text-center">
                            {localMaxWidgetsPerWorkspace}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted italic">
                          Connected to: <span className="font-mono text-foreground/60">{atob(settings.supabaseConfig.url).replace('https://', '').split('.')[0]}</span>
                        </p>
                        <button
                          onClick={async () => {
                             const confirmed = await showAlert({
                               title: "Switch to Local Storage",
                               message: "Are you sure you want to disconnect from Supabase and use local browser storage? Your cloud data will NOT be deleted, but it will no longer be visible until you reconnect.",
                               type: "warning",
                               showCancel: true,
                               confirmText: "Switch to Local",
                               cancelText: "Stay with Cloud"
                             });
                             if (confirmed) {
                               updateSettings({ storageType: 'local' });
                                window.location.href = window.location.origin;
                             }
                          }}
                          className="flex items-center gap-2 text-red-500/60 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md hover:bg-red-500/5"
                        >
                          <RotateCcw size={12} />
                          Switch to Local
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Timezone Section */}
              <section className="space-y-4 pt-1 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Time & Region</h3>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-foreground/80">Default Timezone</label>
                  <p className="text-xs text-muted leading-relaxed mb-2">
                    Used for all time-based metrics and widgets across the dashboard.
                  </p>
                  <div className="space-y-4">
                    <div className="relative" ref={tzDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTzOpen(!isTzOpen)}
                        className={cn(
                          "w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all flex items-center justify-between group",
                          isTzOpen && "ring-1 ring-foreground/20 border-foreground/20 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="text-muted group-hover:text-foreground transition-colors" size={16} />
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">Current Zone</span>
                            <span className="font-bold text-foreground">
                              {localTimezone.split('/').pop()?.replace(/_/g, " ") || 'System Default'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={18} className={cn("text-muted transition-transform duration-300", isTzOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isTzOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 z-50 bg-panel border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col mt-1"
                          >
                            <div className="p-3 border-b border-border bg-background focus-within:bg-muted/10 transition-colors">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                <input
                                  type="text"
                                  placeholder="Search timezones..."
                                  value={tzSearch}
                                  onChange={(e) => setTzSearch(e.target.value)}
                                  className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-0"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 p-2 max-h-[300px] overflow-y-auto custom-scrollbar bg-background/50">
                              {timezones
                                .filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase()))
                                .map((tz) => (
                                  <button
                                    key={tz}
                                    type="button"
                                    onClick={() => {
                                      setLocalTimezone(tz);
                                      setIsTzOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-md border transition-all group shrink-0",
                                      localTimezone === tz
                                        ? "bg-foreground/5 border-foreground/20 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-foreground/5 hover:border-border/10"
                                    )}
                                  >
                                    <div className="flex flex-col items-start gap-0.5 text-left">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tight transition-colors",
                                        localTimezone === tz ? "text-foreground" : "text-muted group-hover:text-foreground"
                                      )}>
                                        {tz.split('/').pop()?.replace(/_/g, " ")}
                                      </span>
                                       <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest">
                                          {tz.split('/').slice(0, -1).join('/') || 'Global'}
                                       </span>
                                    </div>
                                    {localTimezone === tz && (
                                      <div className="p-0.5 rounded-sm bg-foreground text-background">
                                        <Check size={10} />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              {timezones.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase())).length === 0 && (
                                <div className="col-span-full py-12 text-center border border-dashed border-border/40 rounded-lg">
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic text-center">No matching timezones</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </section>

              {/* TV Carousel Section */}
              <section className="space-y-4 pt-1 border-t border-border/50 hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Dashboard Automation</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-semibold text-foreground/80">TV Carousel Mode</label>
                        {localTvCarouselEnabled && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-500 uppercase tracking-wider animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Automatically cycle through all workspaces while in TV Mode.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={localTvCarouselEnabled}
                        onChange={(e) => setLocalTvCarouselEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-all"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {localTvCarouselEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-border/50">
                          <label className="text-sm font-semibold text-foreground/80 block mb-1">Cycle Interval (Seconds)</label>
                          <p className="text-xs text-muted leading-relaxed mb-4">
                            Set the dwell time for each workspace (Minimum 30 seconds).
                          </p>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min="30"
                              value={localTvCarouselInterval}
                              onChange={(e) => setLocalTvCarouselInterval(Number(e.target.value))}
                              className="w-32 bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                            />
                            <span className="text-xs font-bold text-muted uppercase tracking-widest">Seconds</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Internet Status Section */}
                <div className="pt-6 border-t border-border/50 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="text-primary w-4 h-4" />
                        <label className="text-sm font-semibold text-foreground/80">Internet Status Display</label>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Configure how your connection quality is monitored and displayed in the header.
                      </p>
                    </div>
                    <div className="flex bg-muted/20 p-1 rounded-lg border border-border/50">
                      <button
                        type="button"
                        onClick={() => setLocalConnectivityMode('icon')}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                          localConnectivityMode === 'icon' ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                        )}
                      >
                        Icon
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalConnectivityMode('numeric')}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                          localConnectivityMode === 'numeric' ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                        )}
                      >
                        Latency
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Ping Endpoint</label>
                      <input
                        type="text"
                        value={localConnectivityUrl}
                        onChange={(e) => setLocalConnectivityUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Interval (Seconds)</label>
                      <input
                        type="number"
                        min="5"
                        value={localConnectivityEvery}
                        onChange={(e) => setLocalConnectivityEvery(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Latency Thresholds (ms)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Excellent</span>
                        <input
                          type="number"
                          value={localConnectivityThresholdExcellent}
                          onChange={(e) => setLocalConnectivityThresholdExcellent(Number(e.target.value))}
                          className="w-full bg-background border border-emerald-500/20 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Very Good</span>
                        <input
                          type="number"
                          value={localConnectivityThresholdGood}
                          onChange={(e) => setLocalConnectivityThresholdGood(Number(e.target.value))}
                          className="w-full bg-background border border-green-500/20 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-tighter">Average</span>
                        <input
                          type="number"
                          value={localConnectivityThresholdAverage}
                          onChange={(e) => setLocalConnectivityThresholdAverage(Number(e.target.value))}
                          className="w-full bg-background border border-yellow-500/20 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">Slow</span>
                        <input
                          type="number"
                          value={localConnectivityThresholdSlow}
                          onChange={(e) => setLocalConnectivityThresholdSlow(Number(e.target.value))}
                          className="w-full bg-background border border-orange-500/20 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-semibold text-foreground/80">Maximized Widget Carousel</label>
                        {localMaximizedCarouselEnabled && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Auto-Next
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Automatically cycle through widgets in the workspace when one is maximized.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={localMaximizedCarouselEnabled}
                        onChange={(e) => setLocalMaximizedCarouselEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-all"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {localMaximizedCarouselEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <label className="text-sm font-semibold text-foreground/80 block mb-1">Cycle Interval (Seconds)</label>
                          <p className="text-xs text-muted leading-relaxed mb-4">
                            Set the dwell time for each maximized widget (Minimum 20 seconds).
                          </p>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min="20"
                              value={localMaximizedCarouselInterval}
                              onChange={(e) => setLocalMaximizedCarouselInterval(Number(e.target.value))}
                              className="w-32 bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                            />
                            <span className="text-xs font-bold text-muted uppercase tracking-widest">Seconds</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
              
              {/* Alerts Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Alerts & Notifications</h3>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground/80 block mb-1">Signal Snackbar Position</label>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      Choose where you want monitored signals and notifications to appear.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'top-left', label: 'Top Left' },
                        { value: 'top-center', label: 'Top Center' },
                        { value: 'top-right', label: 'Top Right' },
                        { value: 'bottom-left', label: 'Bottom Left' },
                        { value: 'bottom-center', label: 'Bottom Center' },
                        { value: 'bottom-right', label: 'Bottom Right' }
                      ].map((pos) => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => setLocalSnackbarPosition(pos.value as any)}
                          className={cn(
                            "px-4 py-2.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
                            localSnackbarPosition === pos.value 
                              ? "bg-foreground text-background border-foreground shadow-lg shadow-black/20 scale-[1.02]"
                              : "bg-background border-border text-muted hover:border-foreground/30 hover:text-foreground active:scale-95"
                          )}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.storageType !== 'supabase' && (
                    <div className="pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="text-sm font-semibold text-foreground/80 block mb-1">Storage Usage Warning Threshold</label>
                          <p className="text-[10px] text-muted leading-relaxed">
                            Trigger a snackbar notification when your browser's local storage exceeds this percentage.
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-primary">{localLocalStorageThreshold}%</span>
                      </div>

                      <div className="bg-muted/5 border border-border/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <HardDrive size={14} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Current Status</span>
                            <button 
                              onClick={() => setStorageStatus(getStorageUsage())}
                              className="p-1 hover:bg-foreground/5 rounded-full transition-colors text-muted hover:text-primary active:rotate-180"
                              title="Refresh usage"
                            >
                              <RefreshCcw size={10} />
                            </button>
                          </div>
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border",
                            storageStatus.percentage >= localLocalStorageThreshold 
                              ? "bg-red-500/10 text-red-500 border-red-500/20" 
                              : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {storageStatus.percentage >= localLocalStorageThreshold ? "THRESHOLD EXCEEDED" : "OPTIMAL"}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                              <span className="text-xl font-black text-foreground tabular-nums">
                                {storageStatus.usedMB} <span className="text-[10px] font-bold text-muted uppercase tracking-tighter ml-1">MB</span>
                              </span>
                              <span className="text-[10px] font-bold text-muted/60 uppercase tracking-widest">
                                Used of {storageStatus.limitMB} MB Limit
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-lg font-black tabular-nums",
                                storageStatus.percentage >= localLocalStorageThreshold ? "text-red-500" : "text-primary"
                              )}>
                                {storageStatus.percentage}%
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden mt-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${storageStatus.percentage}%` }}
                              className={cn(
                                "h-full transition-colors duration-500",
                                storageStatus.percentage >= 90 ? "bg-red-500" : 
                                storageStatus.percentage >= localLocalStorageThreshold ? "bg-amber-500" : "bg-primary"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <input 
                           type="range"
                           min="50"
                           max="98"
                           value={localLocalStorageThreshold}
                           onChange={(e) => setLocalLocalStorageThreshold(Number(e.target.value))}
                           className="flex-1 accent-primary cursor-pointer"
                         />
                         <span className="text-[10px] font-bold text-muted w-8">98%</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Background Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Visual Performance</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground/80 block mb-1">Custom Background</label>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      Upload an image to use as your dashboard background.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/5 transition-all group overflow-hidden",
                          previewImage && "border-none"
                        )}
                      >
                        {previewImage ? (
                          <>
                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-3 rounded-full bg-muted/10 text-muted group-hover:text-primary transition-colors">
                              <Upload size={24} />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold uppercase text-muted group-hover:text-foreground transition-colors">Click to upload</p>
                              <p className="text-[10px] text-muted/60 mt-1">PNG, JPG up to 2MB</p>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      <div className="flex flex-col justify-center gap-4">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Preview Status</h4>
                          <div className="flex items-center gap-2 text-sm">
                            {previewImage ? (
                              <div className="flex items-center gap-2 text-green-500 font-medium">
                                <Check size={16} />
                                <span>Custom Image Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted font-medium italic">
                                <span>Using System Theme</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {previewImage && (
                            <button
                              onClick={removeImage}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                              Remove Image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {previewImage && (
                      <div className="mt-8 pt-6 border-t border-border/50">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={localUseBgInClock}
                            onChange={(e) => setLocalUseBgInClock(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
                          />
                          <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                            Use this background also in clock maximize
                          </span>
                        </label>
                        <p className="text-[10px] text-muted mt-1 ml-7">
                          When checked, the atmospheric background will be visible during full-screen clock mode.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* AI Integration Section */}
              <section className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">AI Integration</h3>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground/80 block mb-1">AI Analyzer Configuration</label>
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    Select your preferred AI provider and model to perform workspace analysis.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex flex-col h-full">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Provider</label>
                        <select
                          value={localAiProvider}
                          onChange={(e) => {
                            const newProvider = e.target.value as AiProviderId;
                            setLocalAiProvider(newProvider);
                            setLocalAiModel(getDefaultModel(newProvider));
                          }}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase tracking-wider"
                        >
                          {AI_PROVIDERS.map(provider => (
                            <option key={provider.id} value={provider.id}>{provider.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5 flex flex-col h-full">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Model</label>
                         <select
                          value={localAiModel}
                          onChange={(e) => setLocalAiModel(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                          disabled={localAiProvider === 'custom'}
                        >
                          {AI_MODELS[localAiProvider as AiProviderId]?.map((model: { id: string, name: string }) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {localAiProvider !== 'custom' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">API Key</label>
                        <input
                          type="password"
                          value={localAiApiKey}
                          onChange={(e) => setLocalAiApiKey(e.target.value)}
                          placeholder={localAiProvider === 'gemini' ? "AIza..." : "sk-..."}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2 border-t border-border/40">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted">Custom Endpoint URL</label>
                          <input
                            type="url"
                            value={localAiCustomUrl}
                            onChange={(e) => setLocalAiCustomUrl(e.target.value)}
                            placeholder="https://api.my-custom-ai.com/v1/chat/completions"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col h-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Headers (JSON)</label>
                            <textarea
                              value={localAiCustomHeaders}
                              onChange={(e) => setLocalAiCustomHeaders(e.target.value)}
                              placeholder='{"Authorization": "Bearer KEY", "Content-Type": "application/json"}'
                              className="w-full flex-1 min-h-[120px] bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col h-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Body Template (JSON)</label>
                             <textarea
                              value={localAiCustomBody}
                              onChange={(e) => setLocalAiCustomBody(e.target.value)}
                              placeholder='{"messages": [{"role": "system", "content": "__SYSTEM_PROMPT__"}, {"role": "user", "content": "__CONTENT__"}]}'
                              className="w-full flex-1 min-h-[120px] bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex bg-blue-500/5 text-blue-500/80 border border-blue-500/10 rounded-md p-3 items-start gap-3 mt-2">
                           <Info size={14} className="shrink-0 mt-0.5" />
                           <div className="text-[10px] leading-relaxed">
                             <strong className="block mb-1 text-blue-500 font-bold uppercase tracking-wider">Variables</strong>
                             Use <code>__SYSTEM_PROMPT__</code> and <code>__CONTENT__</code> in your template body for dynamic injection.
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Data Management Section */}
              <section className="space-y-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-primary w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Data Orchestration</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export Card */}
                  <div className="p-6 rounded-2xl border border-border bg-muted/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-foreground/5 rounded-lg text-foreground">
                        <Download size={18} />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-tight">Master Export</h4>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Backup your entire system: all settings, custom workspaces, and widget configurations into a single JSON file.
                    </p>
                    
                    <div className="space-y-2 pt-2">
                       {['settings', 'workspaces', 'widgets', 'history'].map(key => (
                         <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={(backupSelection as any)[key]}
                              onChange={(e) => setBackupSelection(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 bg-background"
                            />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-foreground transition-colors text-nowrap">
                              {key === 'settings' ? 'App Settings' : 
                               key === 'workspaces' ? 'Workspaces' : 
                               key === 'widgets' ? 'Widget Configs' : 'Recycle Bin'}
                            </span>
                         </label>
                       ))}
                    </div>

                    <button
                      onClick={handleFullExport}
                      type="button"
                      disabled={backupStatus !== 'idle' || !Object.values(backupSelection).some(Boolean)}
                      className="w-full flex items-center justify-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {backupStatus === 'exporting' ? (
                        <>
                          <RefreshCcw size={14} className="animate-spin" />
                          {backupProgress}%
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          Download Backup
                        </>
                      )}
                    </button>
                  </div>

                  {/* Import Card */}
                  <div className="p-6 rounded-2xl border border-border bg-muted/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-foreground/5 rounded-lg text-foreground">
                        <Upload size={18} />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-tight">Master Import</h4>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Restore your system from a previously exported backup file. This will replace existing data based on your selection.
                    </p>

                    <div className="pt-2">
                       {backupStatus === 'import_preview' && importFileData ? (
                         <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-primary">
                               <div className="flex items-center gap-1.5">
                                 <AlertCircle size={10} />
                                 <span>File Ready</span>
                               </div>
                               <span>v{importFileData.version}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {importFileData.settings && <span className="px-2 py-0.5 bg-primary/20 rounded text-[8px] font-black uppercase">Settings</span>}
                               {importFileData.workspaces?.length > 0 && <span className="px-2 py-0.5 bg-primary/20 rounded text-[8px] font-black uppercase">{importFileData.workspaces.length} Workspaces</span>}
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={handleFullImport}
                                 type="button"
                                 className="flex-1 bg-primary text-white py-1.5 rounded text-[10px] font-bold uppercase hover:bg-primary/90 transition-all active:scale-95"
                               >
                                 Start Import
                               </button>
                               <button 
                                 onClick={() => { setBackupStatus('idle'); setImportFileData(null); }}
                                 type="button"
                                 className="px-3 bg-muted/10 py-1.5 rounded text-[10px] font-bold text-muted hover:text-foreground transition-all"
                               >
                                 Cancel
                               </button>
                            </div>
                         </div>
                       ) : backupStatus === 'importing' ? (
                          <div className="space-y-2">
                             <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted">
                                <span>Importing Progress</span>
                                <span className="text-primary font-mono">{backupProgress}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${backupProgress}%` }}
                                />
                             </div>
                          </div>
                       ) : (
                         <button
                           onClick={() => importFileRef.current?.click()}
                           type="button"
                           className="w-full flex items-center justify-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
                         >
                           <Upload size={14} />
                           Select Backup File
                         </button>
                       )}
                       <input 
                         type="file"
                         ref={importFileRef}
                         onChange={handleImportFileChange}
                         accept=".json"
                         className="hidden"
                       />
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 bg-muted/5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Reset Defaults
              </button>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-foreground text-background px-8 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-foreground/10"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    
    <SupabaseConnectModal 
      isOpen={isSupabaseModalOpen} 
      onClose={() => setIsSupabaseModalOpen(false)} 
    />
    </>
  );
}
