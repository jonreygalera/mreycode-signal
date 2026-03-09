"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import useSWR from "swr";
import type { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat } from "./stat";
import { LabelWidget } from "./label-widget";
import { WidgetAreaChart, WidgetBarChart, WidgetLineChart } from "./charts";
import * as Icons from "lucide-react";
import { PulseWidget } from "./pulse-widget";
import { Loader2, Maximize2, ExternalLink, X, Zap, Trash2, Copy, Check, ArrowLeft, ArrowRight, ChevronDown, Search, MoreVertical, PlayCircle, Code, Play, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTVMode } from "@/context/tv-mode-context";
import { useSettings } from "@/context/settings-context";
import { configToSearchParams } from "@/lib/widget-url";
import { useConnectivity } from "@/context/connectivity-context";
import { useSignals } from "@/context/signal-context";
import { useAlert } from "@/context/alert-context";
import { Clock as ClockIcon } from "../clock";

// Helper for Analog Clock
function AnalogClock({ className, timezone }: { className?: string; timezone?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      if (timezone) {
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
          });
          const parts = formatter.formatToParts(now);
          const map: any = {};
          parts.forEach(p => map[p.type] = p.value);
          
          const tzDate = new Date(
            parseInt(map.year), parseInt(map.month) - 1, parseInt(map.day),
            parseInt(map.hour), parseInt(map.minute), parseInt(map.second)
          );
          setTime(tzDate);
        } catch (e) {
          setTime(new Date());
        }
      } else {
        setTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const seconds = time.getSeconds() * 6;
  const minutes = time.getMinutes() * 6;
  const hours = ((time.getHours() % 12) + time.getMinutes() / 60) * 30;

  return (
    <div className={cn("relative w-32 h-32 rounded-full border-2 border-border/60 bg-panel/30 backdrop-blur-md shadow-inner", className)}>
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-foreground rounded-full z-10" />
      {/* Hands */}
      <div 
        className="absolute bottom-1/2 left-1/2 w-0.5 h-12 bg-foreground/40 rounded-full origin-bottom -translate-x-1/2"
        style={{ transform: `translateX(-50%) rotate(${hours}deg)` }}
      />
      <div 
        className="absolute bottom-1/2 left-1/2 w-0.5 h-14 bg-foreground/60 rounded-full origin-bottom -translate-x-1/2"
        style={{ transform: `translateX(-50%) rotate(${minutes}deg)` }}
      />
      <div 
        className="absolute bottom-1/2 left-1/2 w-px h-14 bg-primary rounded-full origin-bottom -translate-x-1/2"
        style={{ transform: `translateX(-50%) rotate(${seconds}deg)` }}
      />
      {/* Markers */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute top-0 left-1/2 h-full w-px py-1 flex flex-col justify-between origin-bottom -translate-x-1/2"
          style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}
        >
          <div className={cn("w-px h-1 bg-border", i % 3 === 0 ? "h-2 bg-foreground/30" : "")} />
        </div>
      ))}
    </div>
  );
}

const fetcher = async ({ url, method, headers, body }: any) => {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
};

export function WidgetCard({ 
  config, 
  index,
  onEdit,
  onDelete,
  onCopy,
  isMaximized: isMaximizedProp,
  onMaximize,
  allConfigs = [],
  minimal = false,
  readOnly = false
}: { 
  config: WidgetConfig; 
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopy?: (config: WidgetConfig) => void;
  isMaximized?: boolean;
  onMaximize?: (maximized: boolean | string) => void;
  allConfigs?: WidgetConfig[];
  minimal?: boolean;
  readOnly?: boolean;
}) {
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = isMaximizedProp !== undefined ? isMaximizedProp : internalMaximized;
  
  const handleSetMaximized = (val: boolean | string) => {
    if (onMaximize) {
      onMaximize(val);
    } else {
      setInternalMaximized(typeof val === 'string' ? true : val);
    }
  };

  const [isCopied, setIsCopied] = useState(false);
  const { isTVMode } = useTVMode();
  const { settings } = useSettings();
  const { isOnline } = useConnectivity();
  const { activeSignals, tripSignal, dismissSignal } = useSignals();
  const { showAlert } = useAlert();
  const [carouselTimeLeft, setCarouselTimeLeft] = useState<number | null>(null);
  const [isWidgetDropdownOpen, setIsWidgetDropdownOpen] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState("");
  const widgetDropdownRef = useRef<HTMLDivElement>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetDropdownRef.current && !widgetDropdownRef.current.contains(event.target as Node)) {
        setIsWidgetDropdownOpen(false);
        setWidgetSearch("");
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find active signals for this widget
  const widgetActiveSignals = useMemo(() => 
    activeSignals.filter(as => as.widgetId === config.id),
    [activeSignals, config.id]
  );

  const hasActiveSignal = widgetActiveSignals.length > 0;

  const handleCopyConfig = () => {
    // Deep clone to avoid mutating original config and strip runtime flags
    const { isTemp, ...rawConfig } = config as any;
    const exportConfig = JSON.parse(JSON.stringify(rawConfig));
    
    // Mask URL parameters: keeps meta like ?part=statistics, masks ?id=123 or ?key=abc
    const maskUrlParams = (val: any) => {
      if (typeof val !== 'string') return val;
      return val.replace(/([?&][^=]+=)([^&#]*)/g, (match, prefix, value) => {
        // Mask if contains non-alpha chars (likely IDs/secrets), is very long, 
        // or explicitly matches sensitive parameter names
        const isSensitive = /[^a-zA-Z]/.test(value) || value.length > 20 || /key|id|token|auth|secret/i.test(match);
        return isSensitive ? `${prefix}***` : match;
      });
    };

    if (exportConfig.api) exportConfig.api = maskUrlParams(exportConfig.api);
    if (exportConfig.source) exportConfig.source = maskUrlParams(exportConfig.source);
    if (exportConfig.sourceUrl) exportConfig.sourceUrl = maskUrlParams(exportConfig.sourceUrl);

    if (exportConfig.headers) {
      Object.keys(exportConfig.headers).forEach(key => {
        exportConfig.headers[key] = "***";
      });
    }
    
    if (exportConfig.body && typeof exportConfig.body === 'object') {
      Object.keys(exportConfig.body).forEach(key => {
        exportConfig.body[key] = "***";
      });
    }

    navigator.clipboard.writeText(JSON.stringify(exportConfig, null, 2));
    if (onCopy) {
      onCopy(exportConfig);
    } else {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenPlayground = () => {
    const { isTemp, ...rawConfig } = config as any;
    const params = configToSearchParams(rawConfig);
    window.open(`/playground?${params.toString()}`, '_blank');
    setIsOptionsMenuOpen(false);
  };

  const handleCopyIframe = async () => {
    const { isTemp, ...rawConfig } = config as any;
    const params = configToSearchParams(rawConfig);
    params.set("theme", "dark");
    params.set("maximized", "true");
    params.set("minimal", "true");
    const iframeCode = `<iframe src="${window.location.origin}/widget/preview?${params.toString()}" width="100%" height="400" frameborder="0" style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setIsOptionsMenuOpen(false);
    
    await showAlert({
      title: "Copied to Clipboard",
      message: "The Iframe embed code has been copied. You can paste it into your Notion, website, or anywhere else that supports IFrames.",
      type: "success",
      confirmText: "Awesome",
      showCancel: false
    });
  };

  const { data, error, isLoading, mutate } = useSWR(
    (isOnline && config.api && config.api !== "none") ? {
      url: config.api,
      method: config.method || "GET",
      headers: config.headers,
      body: config.body,
    } : null,
    fetcher,
    {
      refreshInterval: isOnline ? (config.refreshInterval || 0) : 0,
      revalidateOnFocus: isOnline,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );


  const parsedData = useMemo(() => {
    if (!data && !['clock', 'iframe', 'status', 'progress', 'label', 'pulse'].includes(config.type)) return null;
    
    let value = (data && config.responsePath) ? getNestedProperty(data, config.responsePath) : data;
    
    // Apply Transform Middleware if exists
    if (config.transformer && value !== null) {
      try {
        // Safe evaluation of transformer logic
        // eslint-disable-next-line no-new-func
        const transformFn = new Function('val', 'data', `return (${config.transformer})(val, data)`);
        value = transformFn(value, data);
      } catch (e) {
        console.error("Transformer error:", e);
      }
    }

    // Force stat value to a number if type is stat
    if (config.type === "stat") {
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    }

    return value;
  }, [data, config.responsePath, config.type, config.transformer]);

  // Signal Triggering Logic
  const prevDataValue = useMemo(() => {
    // We use a ref to track the previous value across refreshes
    return { current: parsedData };
  }, [parsedData]);
  
  const [lastValue, setLastValue] = useState<number | null>(null);

  useEffect(() => {
    if (parsedData === null || !config.signals || config.signals.length === 0) return;

    const val = Number(parsedData);

    config.signals.forEach(signal => {
      if (!signal.enabled) return;

      let triggered = false;

      switch (signal.condition) {
        case 'above': triggered = val > signal.threshold; break;
        case 'below': triggered = val < signal.threshold; break;
        case 'equals': triggered = val === signal.threshold; break;
        case 'diff': {
          if (lastValue !== null) {
            triggered = Math.abs(val - lastValue) >= signal.threshold;
          }
          break;
        }
      }

      if (triggered) {
        tripSignal(config, signal, val);
      } else {
        // Auto-dismiss if condition no longer met
        dismissSignal(config.id, signal.id);
      }
    });

    setLastValue(val);
  }, [parsedData, config, tripSignal, dismissSignal, lastValue]);
  
  const moveCarousel = (dir: "next" | "prev") => {
    if (!allConfigs || allConfigs.length <= 1) return;
    const currentIndex = allConfigs.findIndex(c => c.id === config.id);
    let nextIndex;
    if (dir === "next") {
      nextIndex = (currentIndex + 1) % allConfigs.length;
    } else {
      nextIndex = (currentIndex - 1 + allConfigs.length) % allConfigs.length;
    }
    const nextId = allConfigs[nextIndex].id;
    handleSetMaximized(nextId);
  };
  
  // Carousel Timer Logic
  useEffect(() => {
    if (!isMaximized || !settings.maximizedCarouselEnabled || allConfigs.length <= 1) {
      setCarouselTimeLeft(null);
      return;
    }

    const intervalSeconds = Math.max(20, settings.maximizedCarouselInterval);
    
    // Initial time update if not already set
    if (carouselTimeLeft === null) {
      setCarouselTimeLeft(intervalSeconds);
    }

    const timer = setInterval(() => {
      if (!isStopped) {
        setCarouselTimeLeft(prev => {
          if (prev === null) return intervalSeconds;
          if (prev <= 1) {
            moveCarousel("next");
            return intervalSeconds;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMaximized, settings.maximizedCarouselEnabled, settings.maximizedCarouselInterval, allConfigs.length, config.id, isStopped]);

  // Handle Widget Reset when STOPPED
  useEffect(() => {
    if (isMaximized && isStopped && allConfigs.length > 0) {
      const intervalSeconds = Math.max(20, settings.maximizedCarouselInterval);
      setCarouselTimeLeft(intervalSeconds);

      const firstWidgetId = allConfigs[0].id;
      if (config.id !== firstWidgetId) {
        handleSetMaximized(firstWidgetId);
      }
    }
  }, [isMaximized, isStopped]);

  // Keyboard navigation
  useEffect(() => {
    if (!isMaximized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowRight") {
        moveCarousel("next");
      } else if (e.key === "ArrowLeft") {
        moveCarousel("prev");
      } else if (e.key === "Escape") {
        handleSetMaximized(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, allConfigs.length, config.id]);

  const sourceLabel = useMemo(() => {
    if (config.source) return config.source;
    if (!config.api || config.api === "none") return "Static Widget";
    try {
      if (config.api.startsWith("/")) return "Local Network";
      return new URL(config.api).hostname;
    } catch (e) {
      return "External Source";
    }
  }, [config.api, config.source]);

  const sizeClasses = {
    sm: "flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.75rem)] min-w-[280px] sm:min-w-[300px] min-h-[200px]",
    md: "flex-grow basis-full md:basis-[calc(50%-0.5rem)] min-w-[280px] md:min-w-[400px] min-h-[250px]",
    lg: "flex-grow basis-full lg:basis-[calc(66.66%-1rem)] min-w-[280px] min-h-[300px]",
    xl: "flex-grow basis-full min-w-[280px] min-h-[400px]",
  };

  const isStat = config.type === "stat" || config.type === "status" || config.type === "clock" || config.type === "pulse";
  const currentSizeClass = sizeClasses[config.size || "sm"];
  const finalSizeClass = isStat 
    ? cn(currentSizeClass, "min-h-0 h-auto min-w-0 sm:min-w-[240px]") 
    : currentSizeClass;

  const accentStyle = config.accentColor ? {
    borderColor: `${config.accentColor}40`,
    boxShadow: `0 0 20px -10px ${config.accentColor}30`,
  } : {};

  const renderContent = (isMaximizedView = false) => (
    <>
      {minimal && (
        <div className="absolute top-2.5 left-3.5 z-10 pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" /> {config.label}
          </span>
        </div>
      )}
      {!minimal && (
        <div className={cn("flex flex-row items-start justify-between gap-2 mb-2 pb-2 border-border/40", !isMaximizedView && "border-b")}>
          <div className="flex flex-col relative">
            <div className="flex items-center gap-2">
              {!isMaximizedView ? (
                <h3 className="font-semibold uppercase tracking-wider text-muted text-xs">
                  {config.label}
                </h3>
              ) : (
                <div className="flex items-center gap-2 mr-2" ref={widgetDropdownRef}>
                  {readOnly ? (
                    <div className="flex flex-col items-start px-3 py-1.5 transition-all outline-none">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/60 leading-none mb-1">Active Widget</span>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight leading-none text-left">
                          {config.label}
                        </h2>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsWidgetDropdownOpen(!isWidgetDropdownOpen);
                        if (isWidgetDropdownOpen) setWidgetSearch("");
                      }}
                      className="flex flex-col items-start px-3 py-1.5 group/ws transition-all hover:bg-foreground/5 rounded-xl border border-transparent hover:border-border/30 relative z-10"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/60 leading-none mb-1 group-hover/ws:text-primary transition-colors">Active Widget</span>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight leading-none text-left">
                          {config.label}
                        </h2>
                        {allConfigs.length > 1 && <ChevronDown size={14} className={cn("text-muted/60 transition-transform duration-300", isWidgetDropdownOpen && "rotate-180")} />}
                      </div>
                    </button>
                  )}

                  <AnimatePresence>
                    {isWidgetDropdownOpen && allConfigs.length > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-14 left-2 z-50 w-72 mt-2 overflow-hidden rounded-2xl border border-border bg-[#ffffff] dark:bg-[#131722] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-none!"
                      >
                        <div className="p-3 border-b border-border/30 bg-muted/5">
                          <div className="relative group/search">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" />
                            <input
                              type="text"
                              placeholder="Search widgets..."
                              value={widgetSearch}
                              onChange={(e) => setWidgetSearch(e.target.value)}
                                                             className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-bold uppercase tracking-wider"
                              autoFocus
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {allConfigs.filter(w => w.label.toLowerCase().includes(widgetSearch.toLowerCase())).map(w => (
                            <button
                              key={w.id}
                              onClick={() => {
                                handleSetMaximized(w.id);
                                setIsWidgetDropdownOpen(false);
                                setWidgetSearch("");
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all mb-1 group/item",
                                config.id === w.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/10 border border-transparent"
                              )}
                            >
                              <span className={cn("text-xs font-black uppercase tracking-wider", config.id === w.id ? "text-primary" : "text-muted group-hover/item:text-foreground")}>{w.label}</span>
                              {config.id === w.id && <Check size={14} className="text-primary" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {hasActiveSignal && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-[2px] shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                  </span>
                  <span className="text-[8px] font-mono leading-none font-bold text-red-500/90 tracking-tighter">SIGNAL TRIP</span>
                </div>
              )}
            </div>
            {config.description && (
              <p className={cn("text-muted/70 mt-0.5", isMaximizedView ? "text-xs" : "text-[10px] truncate max-w-[90%]")}>
                {config.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!readOnly && (
              <div className="flex items-center gap-1 mr-1 pr-1 border-r border-border/40">
                <button 
                  onClick={() => onEdit?.(config.id)}
                  className="p-1 hover:bg-foreground/5 rounded transition-colors text-muted hover:text-foreground"
                  title="Edit configuration"
                >
                  <Zap size={14} className="text-yellow-500/80" />
                </button>
                <div className="relative" ref={optionsMenuRef}>
                  <button 
                    onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                    className="p-1 hover:bg-foreground/5 rounded transition-colors text-muted hover:text-foreground"
                    title="More options"
                  >
                    <MoreVertical size={14} />
                  </button>
                  <AnimatePresence>
                    {isOptionsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-1 z-50 w-48 overflow-hidden rounded-md border border-border bg-[#ffffff] dark:bg-[#131722] shadow-2xl flex flex-col p-1 backdrop-blur-none!"
                      >
                        <button
                          onClick={handleOpenPlayground}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-all hover:bg-muted/10 rounded-sm text-left w-full group"
                        >
                          <PlayCircle size={14} className="group-hover:text-primary transition-colors" />
                          <span>Open in Playground</span>
                        </button>
                        <button
                          onClick={handleCopyIframe}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-all hover:bg-muted/10 rounded-sm text-left w-full group"
                        >
                          <Code size={14} className="group-hover:text-primary transition-colors" />
                          <span>Embed with Iframe</span>
                        </button>
                        <div className="h-px w-full bg-border/50 my-1" />
                        <button
                          onClick={() => {
                            onDelete?.(config.id);
                            setIsOptionsMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500/80 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-sm text-left w-full group"
                        >
                          <Trash2 size={14} />
                          <span>Delete Widget</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {isMaximizedView && carouselTimeLeft !== null && settings.maximizedCarouselEnabled && allConfigs.length > 1 && (
              <div className="flex items-center gap-3 px-3 py-1.5 bg-foreground/5 rounded-full border border-border/10 mr-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsStopped(!isStopped)}
                    className="p-1 hover:bg-foreground/10 rounded-full transition-colors text-primary active:scale-90"
                    title={isStopped ? "Play Carousel" : "Stop Carousel"}
                  >
                    {isStopped ? <Play size={12} fill="currentColor" /> : <Square size={12} fill="currentColor" />}
                  </button>
                  <div className="h-3 w-px bg-border/20 mx-0.5" />
                <div className="relative flex items-center justify-center w-5 h-5">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-foreground/5"
                    />
                    <motion.circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={50}
                      initial={{ strokeDashoffset: 50 }}
                      animate={{ 
                        strokeDashoffset: 50 - (50 * (carouselTimeLeft / settings.maximizedCarouselInterval))
                      }}
                      transition={{ duration: 0.5, ease: "linear" }}
                      className="text-primary"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-foreground">
                    {carouselTimeLeft}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/50 leading-none mb-0.5">Next Switch</span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider leading-none">
                    {isStopped ? "Stopped" : "Active"}
                  </span>
                </div>
              </div>
            )}
            {isMaximizedView && allConfigs.length > 1 && (
              <div className="flex items-center gap-2 mr-4 pr-4 border-r border-border/40">
                <div className="flex flex-col items-center min-w-[60px] mx-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted/40 whitespace-nowrap">
                    {allConfigs.findIndex(c => c.id === config.id) + 1} / {allConfigs.length}
                  </span>
                </div>
              </div>
            )}
            {!isMaximizedView && !readOnly && (
              <>
                <button
                  onClick={handleCopyConfig}
                  className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                  title="Copy widget config"
                >
                  {isCopied ? <Check size={14} className="text-up" /> : <Copy size={14} />}
                </button>
                <button 
                  onClick={() => handleSetMaximized(true)}
                  className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                  title="Maximize"
                >
                  <Maximize2 size={14} />
                </button>
              </>
            )}
            {isMaximizedView && (
              <>
                {!readOnly && (
                  <>
                    <div className="hidden sm:flex items-center scale-[0.85] origin-right mr-3 pr-3 border-r border-border/40 opacity-80">
                      <ClockIcon />
                    </div>
                    <button
                      onClick={handleCopyConfig}
                      className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                      title="Copy widget config"
                    >
                      {isCopied ? <Check size={14} className="text-up" /> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={() => handleSetMaximized(false)}
                      className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                    >
                      <X size={20} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className={cn("flex flex-1 items-center justify-center w-full min-h-0 relative", isMaximizedView ? "mt-4" : "mt-2")}>
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500 font-medium">
            Failed to load data.
          </div>
        )}
        {!isLoading && !error && (parsedData !== null || ['iframe', 'clock', 'status', 'progress', 'label', 'pulse'].includes(config.type)) && (
          <div className={cn(
            "flex w-full flex-col justify-center",
            isStat ? "h-full" : "absolute inset-0 pt-4" 
          )}>
            {config.type === "pulse" && (
              <PulseWidget
                data={parsedData}
                config={config.config}
                accentColor={config.accentColor}
                size={config.size}
                color={config.color}
                colorRules={config.colorRules}
              />
            )}
            {config.type === "label" && (
              <LabelWidget
                label={config.label}
                config={config.config}
                data={parsedData as string}
                size={config.size}
              />
            )}
            {config.type === "stat" && (
              <AnimatedStat
                value={parsedData as number}
                prefix={config.config?.prefix}
                suffix={config.config?.suffix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl}
                size={isMaximizedView ? "lg" : "md"}
                abbreviate={config.config?.abbreviate}
                color={config.color}
                colorRules={config.colorRules}
              />
            )}
            {config.type === "chart" && Array.isArray(parsedData) && (
              <>
                {config.config.chart === "line" && (
                  <WidgetLineChart
                    data={parsedData}
                    xKey={config.config.xKey}
                    yKey={config.config.yKey}
                    prefix={config.config.prefix}
                    suffix={config.config.suffix}
                    source={sourceLabel}
                    sourceUrl={config.sourceUrl}
                    className="pt-2 pb-1"
                  />
                )}
                {config.config.chart === "area" && (
                  <WidgetAreaChart
                    data={parsedData}
                    xKey={config.config.xKey}
                    yKey={config.config.yKey}
                    prefix={config.config.prefix}
                    suffix={config.config.suffix}
                    source={sourceLabel}
                    sourceUrl={config.sourceUrl}
                    className="pt-2 pb-1"
                  />
                )}
                {config.config.chart === "bar" && (
                  <WidgetBarChart
                    data={parsedData}
                    xKey={config.config.xKey}
                    yKey={config.config.yKey}
                    prefix={config.config.prefix}
                    suffix={config.config.suffix}
                    source={sourceLabel}
                    sourceUrl={config.sourceUrl}
                    className="pt-2 pb-1"
                  />
                )}
              </>
            )}
            {config.type === "iframe" && (
              <div className="flex-1 w-full h-full min-h-[200px] overflow-hidden rounded-lg bg-black/5">
                <iframe 
                  src={config.config?.iframeUrl || config.api} 
                  className="w-full h-full border-none pointer-events-auto"
                  title={config.label}
                />
              </div>
            )}
            {config.type === "list" && Array.isArray(parsedData) && (
              <div className="flex-1 w-full overflow-y-auto space-y-1 scrollbar-none">
                {parsedData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-sm bg-muted/5 border border-border/30 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-medium truncate flex-1">{item.label || item.name || String(item)}</span>
                    {item.value && <span className="text-[10px] font-mono font-bold text-muted">{item.value}</span>}
                  </div>
                ))}
              </div>
            )}
            {config.type === "clock" && (
              <div className="flex flex-col items-center justify-center py-4">
                {config.config?.displayType === "analog" ? (
                  <AnalogClock timezone={config.config?.timezone} />
                ) : (
                  <div className="scale-125">
                    <ClockIcon timezone={config.config?.timezone} isWidget />
                  </div>
                )}
              </div>
            )}
            {config.type === "status" && (
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle border-4",
                  parsedData ? "bg-up/10 border-up/20 text-up" : "bg-down/10 border-down/20 text-down"
                )}>
                  {(() => {
                    const iconName = parsedData 
                      ? (config.config as any)?.trueIcon || "Zap" 
                      : (config.config as any)?.falseIcon || "Zap";
                    const IconComponent = (Icons as any)[iconName] || Icons.Zap;
                    return <IconComponent size={32} fill="currentColor" className="opacity-80" />;
                  })()}
                </div>
                <div className="flex flex-col items-center gap-1">
                   <span className={cn("text-lg font-black uppercase tracking-tighter", parsedData ? "text-up" : "text-down")}>
                     {parsedData 
                       ? (config.config as any)?.trueLabel || "SYSTEM ONLINE" 
                       : (config.config as any)?.falseLabel || "SYSTEM DOWN"}
                   </span>
                   <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] font-bold">
                     Last Checked: {new Date().toLocaleTimeString()}
                   </span>
                </div>
              </div>
            )}
            {config.type === "progress" && (
              <div className="flex flex-col gap-4 py-2 px-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono tracking-tighter">
                    {Number(parsedData).toFixed(1)}%
                  </span>
                  <div className="h-6 w-px bg-border" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest pl-4">Capacity</span>
                </div>
                <div className="w-full h-3 bg-muted/10 rounded-full overflow-hidden border border-border/40">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, Number(parsedData)))}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      Number(parsedData) > 90 ? "bg-down" : Number(parsedData) > 70 ? "bg-warning" : "bg-up"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  const pathname = usePathname();
  const isIframe = pathname?.includes("/iframe");

  if (isIframe) {
    return (
      <div className="flex h-full w-full flex-col bg-panel p-4 overflow-hidden">
        {renderContent(true)}
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
        style={accentStyle}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[4px] border border-border bg-panel/70 backdrop-blur-2xl p-4 transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-0.5 group",
          finalSizeClass,
          !isStat && "@container"
        )}
      >
        {config.accentColor && (
          <div 
            className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 pointer-events-none rounded-full"
            style={{ backgroundColor: config.accentColor }}
          />
        )}
        {renderContent()}
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                if (info.offset.x > swipeThreshold) {
                  moveCarousel("prev");
                } else if (info.offset.x < -swipeThreshold) {
                  moveCarousel("next");
                }
              }}
              className="relative w-full h-full bg-panel border-0 p-6 shadow-2xl flex flex-col touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent(true)}

              {/* Floating Navigation Arrows - Elegant Glassmorphism */}
              {allConfigs.length > 1 && !readOnly && (
                <>
                  {/* Left Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCarousel("prev");
                    }}
                    className="fixed left-6 top-1/2 -translate-y-1/2 z-60 group/nav-prev active:scale-95 transition-all"
                    title="Previous (Left Arrow)"
                  >
                    <div className="p-4 rounded-full bg-background/5 backdrop-blur-md border border-white/5 text-muted/20 group-hover/nav-prev:text-primary group-hover/nav-prev:scale-110 group-hover/nav-prev:bg-background/10 transition-all shadow-2xl">
                      <ArrowLeft size={32} strokeWidth={2.5} className="group-hover/nav-prev:-translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Right Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCarousel("next");
                    }}
                    className="fixed right-6 top-1/2 -translate-y-1/2 z-60 group/nav-next active:scale-95 transition-all"
                    title="Next (Right Arrow)"
                  >
                    <div className="p-4 rounded-full bg-background/5 backdrop-blur-md border border-white/5 text-muted/20 group-hover/nav-next:text-primary group-hover/nav-next:scale-110 group-hover/nav-next:bg-background/10 transition-all shadow-2xl">
                      <ArrowRight size={32} strokeWidth={2.5} className="group-hover/nav-next:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Mobile/Tablet Specific Bottom Navigation Indicator */}
                  <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-60 flex md:hidden items-center gap-6 p-4 rounded-3xl bg-background/5 backdrop-blur-2xl border border-white/5 shadow-2xl pointer-events-none">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted/40 whitespace-nowrap">
                        {allConfigs.findIndex(c => c.id === config.id) + 1} / {allConfigs.length}
                      </span>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
