"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat, StaticStringStat } from "./stat";
import { WidgetAreaChart, WidgetBarChart, WidgetLineChart } from "./charts";
import { Loader2, Maximize2, ExternalLink, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  onDelete
}: { 
  config: WidgetConfig; 
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [isMaximized, setIsMaximized] = useState(false);

  const { data, error, isLoading } = useSWR(
    {
      url: config.api,
      method: config.method || "GET",
      headers: config.headers,
      body: config.body,
    },
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
    if (!data) return null;
    return getNestedProperty(data, config.responsePath);
  }, [data, config.responsePath]);

  const sourceLabel = useMemo(() => {
    if (config.source) return config.source;
    try {
      if (config.api.startsWith("/")) return "Local Network";
      return new URL(config.api).hostname;
    } catch (e) {
      return "Unknown Source";
    }
  }, [config.api, config.source]);

  const sizeClasses = {
    sm: "flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33%-0.75rem)] min-w-[300px] min-h-[200px]",
    md: "flex-grow basis-full md:basis-[calc(50%-0.5rem)] min-w-[400px] min-h-[250px]",
    lg: "flex-grow basis-full lg:basis-[calc(66%-1rem)] min-h-[300px]",
    xl: "flex-grow basis-full min-h-[400px]",
  };

  const isStat = config.type === "stat";
  const currentSizeClass = sizeClasses[config.size || (isStat ? "sm" : "sm")];
  const finalSizeClass = isStat 
    ? cn(currentSizeClass, "min-h-0 h-auto min-w-[240px]") 
    : currentSizeClass;

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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <X size={14} />
              </button>
            </div>
          )}
          {!isMaximizedView && (
            <>
              <button 
                onClick={() => setIsMaximized(true)}
                className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                title="Maximize"
              >
                <Maximize2 size={14} />
              </button>
              {!config.isTemp && (
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
            <button 
              onClick={() => setIsMaximized(false)}
              className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
            >
              <X size={20} />
            </button>
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
            "flex w-full flex-col justify-end",
            config.type === "stat" ? "h-full" : "absolute inset-0 pt-4" 
          )}>
            {config.type === "stat" && typeof parsedData === "number" && (
              <AnimatedStat
                value={parsedData}
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
            {config.type === "stat" && typeof parsedData !== "number" && (
              <StaticStringStat 
                value={String(parsedData)} 
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
                className="pt-2 pb-1"
              />
            )}
            {config.type === "area" && Array.isArray(parsedData) && (
              <WidgetAreaChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                className="pt-2 pb-1"
              />
            )}
            {config.type === "bar" && Array.isArray(parsedData) && (
              <WidgetBarChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                className="pt-2 pb-1"
              />
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
        whileHover={{ y: -4 }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-[4px] border border-border bg-panel p-4 transition-colors hover:border-muted",
          finalSizeClass,
          !isStat && "@container"
        )}
      >
        {renderContent()}
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 md:p-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full max-w-6xl bg-panel border border-border rounded-lg p-6 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent(true)}
            </motion.div>
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setIsMaximized(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
