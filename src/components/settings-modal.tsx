"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Image as ImageIcon, RotateCcw, Save, Trash2, Check, Upload } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { useAlert } from "@/context/alert-context";

import { DEFAULT_SETTINGS } from "@/config/settings";
import { cn } from "@/lib/utils";

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
  const [previewImage, setPreviewImage] = useState<string | null>(settings.backgroundImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timezones, setTimezones] = useState<string[]>([]);

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
    setPreviewImage(settings.backgroundImage);
  }, [settings, isOpen]);

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
      setPreviewImage(DEFAULT_SETTINGS.backgroundImage);
    }
  };


  const removeImage = () => {
    setLocalBgImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                  <select
                    value={localTimezone}
                    onChange={(e) => setLocalTimezone(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
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
