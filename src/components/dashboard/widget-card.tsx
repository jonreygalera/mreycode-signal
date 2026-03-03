"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import type { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat } from "./stat";
import { WidgetAreaChart, WidgetBarChart, WidgetLineChart } from "./charts";
import { Loader2, Maximize2, ExternalLink, X, Zap, Trash2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTVMode } from "@/context/tv-mode-context";
import { useSettings } from "@/context/settings-context";
import { Clock as ClockIcon } from "../clock";

// Helper for Analog Clock
function AnalogClock({ className }: { className?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  isMaximized: isMaximizedProp,
  onMaximize
}: { 
  config: WidgetConfig; 
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isMaximized?: boolean;
  onMaximize?: (maximized: boolean) => void;
}) {
  const [internalMaximized, setInternalMaximized] = useState(false);
  const isMaximized = isMaximizedProp !== undefined ? isMaximizedProp : internalMaximized;
  
  const handleSetMaximized = (val: boolean) => {
    if (onMaximize) {
      onMaximize(val);
    } else {
      setInternalMaximized(val);
    }
  };

  const [isCopied, setIsCopied] = useState(false);
  const { isTVMode } = useTVMode();
  const { settings } = useSettings();

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
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const { data, error, isLoading, mutate } = useSWR(
    config.api && config.api !== "none" ? {
      url: config.api,
      method: config.method || "GET",
      headers: config.headers,
      body: config.body,
    } : null,
    fetcher,
    {
      refreshInterval: config.refreshInterval || 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );


  const parsedData = useMemo(() => {
    if (!data && config.type !== 'clock' && config.type !== 'iframe' && config.type !== 'status' && config.type !== 'progress') return null;
    
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

  const isStat = config.type === "stat" || config.type === "status" || config.type === "clock";
  const currentSizeClass = sizeClasses[config.size || (isStat ? "sm" : "sm")];
  const finalSizeClass = isStat 
    ? cn(currentSizeClass, "min-h-0 h-auto min-w-0 sm:min-w-[240px]") 
    : currentSizeClass;

  const accentStyle = config.accentColor ? {
    borderColor: `${config.accentColor}40`,
    boxShadow: `0 0 20px -10px ${config.accentColor}30`,
  } : {};

  const renderContent = (isMaximizedView = false) => (
    <>
      <div className="flex flex-row items-start justify-between gap-2 mb-2 pb-2 border-b border-border/40">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold uppercase tracking-wider text-muted", isMaximizedView ? "text-sm" : "text-xs")}>
              {config.label}
            </h3>
            {config.isTemp && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400/10 border border-yellow-400/20 rounded-[2px] shadow-[0_0_8px_rgba(250,204,21,0.1)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                </span>
                <span className="text-[8px] font-mono leading-none font-bold text-yellow-500/90 tracking-tighter">TEMP</span>
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
          {config.isTemp && (
            <div className="flex items-center gap-1 mr-1 pr-1 border-r border-border/40">
              <button 
                onClick={() => onEdit?.(config.id)}
                className="p-1 hover:bg-foreground/5 rounded transition-colors text-muted hover:text-foreground"
                title="Edit configuration"
              >
                <Zap size={14} className="text-yellow-500/80" />
              </button>
              <button 
                onClick={() => onDelete?.(config.id)}
                className="p-1 hover:bg-red-500/5 rounded transition-colors text-muted hover:text-red-500"
                title="Delete widget"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          {!isMaximizedView && (
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
              {!config.isTemp && !isTVMode && (
                <Link
                  href={`/widget/${config.id}`}
                  className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                  title="Open in new page"
                >
                  <ExternalLink size={14} />
                </Link>
              )}
            </>
          )}
          {isMaximizedView && (
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
        </div>
      </div>

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
        {!isLoading && !error && parsedData !== null && parsedData !== undefined && (
          <div className={cn(
            "flex w-full flex-col justify-center",
            isStat ? "h-full" : "absolute inset-0 pt-4" 
          )}>
            {config.type === "stat" && (
              <AnimatedStat
                value={parsedData as number}
                prefix={config.prefix}
                suffix={config.suffix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl}
                size={isMaximizedView ? "lg" : "md"}
                abbreviate={config.abbreviate}
                color={config.color}
                colorRules={config.colorRules}
              />
            )}
            {config.type === "line" && Array.isArray(parsedData) && (
              <WidgetLineChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl}
                className="pt-2 pb-1"
              />
            )}
            {config.type === "area" && Array.isArray(parsedData) && (
              <WidgetAreaChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl}
                className="pt-2 pb-1"
              />
            )}
            {config.type === "bar" && Array.isArray(parsedData) && (
              <WidgetBarChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl}
                className="pt-2 pb-1"
              />
            )}
            {config.type === "iframe" && (
              <div className="flex-1 w-full h-full min-h-[200px] overflow-hidden rounded-lg bg-black/5">
                <iframe 
                  src={config.iframeUrl || config.api} 
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
                {config.displayType === "analog" ? (
                  <AnalogClock />
                ) : (
                  <div className="scale-125">
                    <ClockIcon />
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
                  <Zap size={32} fill="currentColor" className="opacity-80" />
                </div>
                <div className="flex flex-col items-center gap-1">
                   <span className={cn("text-lg font-black uppercase tracking-tighter", parsedData ? "text-up" : "text-down")}>
                     {parsedData ? "SYSTEM ONLINE" : "SYSTEM DOWN"}
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
              className="relative w-full h-full bg-panel border-0 p-6 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
