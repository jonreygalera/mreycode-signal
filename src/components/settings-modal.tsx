"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Image as ImageIcon, RotateCcw, Save, Trash2, Check, Upload, Search, Type, ChevronDown, Download, LayoutDashboard, Database, Settings as SettingsIcon, AlertCircle, RefreshCcw, HardDrive } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { useAlert } from "@/context/alert-context";
import { exportFullBackup, importFullBackup, BackupData } from "@/lib/backup-utils";
import { appConfig } from "@/config/app";

import { DEFAULT_SETTINGS } from "@/config/settings";
import { cn } from "@/lib/utils";
import { getStorageUsage } from "@/lib/storage-utils";

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
  const [localSnackbarPosition, setLocalSnackbarPosition] = useState(settings.snackbarPosition);
  const [localLocalStorageThreshold, setLocalLocalStorageThreshold] = useState(settings.localStorageThreshold);
  const [previewImage, setPreviewImage] = useState<string | null>(settings.backgroundImage);
  const [storageStatus, setStorageStatus] = useState(getStorageUsage());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [tzSearch, setTzSearch] = useState("");
  const [isTzOpen, setIsTzOpen] = useState(false);
  const tzDropdownRef = useRef<HTMLDivElement>(null);
  
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
    setLocalSnackbarPosition(settings.snackbarPosition);
    setLocalLocalStorageThreshold(settings.localStorageThreshold);
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
      snackbarPosition: localSnackbarPosition,
      localStorageThreshold: localLocalStorageThreshold,
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
      setLocalSnackbarPosition(DEFAULT_SETTINGS.snackbarPosition);
      setLocalLocalStorageThreshold(DEFAULT_SETTINGS.localStorageThreshold);
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
      // Refresh to apply everything
      window.location.reload();
    }, 1000);
  };

  return (
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
              {/* Timezone Section */}
              <section className="space-y-4">
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
              <section className="space-y-4">
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
  );
}
