"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat, StaticStringStat } from "./stat";
import { WidgetAreaChart, WidgetBarChart, WidgetLineChart } from "./charts";
import { Loader2, Maximize2, ExternalLink, X } from "lucide-react";
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

export function WidgetCard({ config, index }: { config: WidgetConfig; index: number }) {
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
  const currentSizeClass = isStat 
    ? "flex-grow basis-auto h-fit min-w-[240px]" 
    : sizeClasses[config.size || "sm"];

  const renderContent = (isMaximizedView = false) => (
    <>
      <div className="flex flex-row items-start justify-between gap-2 mb-2 pb-2 border-b border-border/40">
        <div className="flex flex-col">
          <h3 className={cn("font-semibold uppercase tracking-wider text-muted", isMaximizedView ? "text-sm" : "text-xs")}>
            {config.label}
          </h3>
          {config.description && (
            <p className={cn("text-muted/70 mt-0.5", isMaximizedView ? "text-xs" : "text-[10px] truncate max-w-[90%]")}>
              {config.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isMaximizedView && (
            <>
              <button 
                onClick={() => setIsMaximized(true)}
                className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                title="Maximize"
              >
                <Maximize2 size={14} />
              </button>
              <Link
                href={`/widget/${config.id}`}
                className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground"
                title="Open in new page"
              >
                <ExternalLink size={14} />
              </Link>
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
              />
            )}
            {config.type === "stat" && typeof parsedData !== "number" && (
              <StaticStringStat 
                value={String(parsedData)} 
                prefix={config.prefix}
                suffix={config.suffix}
                source={sourceLabel}
                sourceUrl={config.sourceUrl} 
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
          currentSizeClass,
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
