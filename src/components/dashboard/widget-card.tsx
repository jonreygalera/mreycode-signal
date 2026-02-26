"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat, StaticStringStat } from "./stat";
import { WidgetAreaChart, WidgetBarChart, WidgetLineChart } from "./charts";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
      revalidateOnFocus: true,     // Optional, nice for dashboard returning
      revalidateOnReconnect: true,
      dedupingInterval: 2000,      // Prevent identical rapid API spam
      keepPreviousData: true,      // Smoothly transitions stats without flashing loaders
    }
  );

  const parsedData = useMemo(() => {
    if (!data) return null;
    return getNestedProperty(data, config.responsePath);
  }, [data, config.responsePath]);

  // Derive source label automatically if not explicitly provided
  const sourceLabel = useMemo(() => {
    if (config.source) return config.source;
    try {
      if (config.api.startsWith("/")) return "Local Network";
      return new URL(config.api).hostname;
    } catch (e) {
      return "Unknown Source";
    }
  }, [config.api, config.source]);

  // Map size to Flex layouts for charts (charts need stretch limits)
  const sizeClasses = {
    sm: "flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33%-0.75rem)] min-w-[300px]",
    md: "flex-grow basis-full md:basis-[calc(50%-0.5rem)] min-w-[400px]",
    lg: "flex-grow basis-full lg:basis-[calc(66%-1rem)] min-h-[300px]",
    xl: "flex-grow basis-full min-h-[400px]",
  };

  const isStat = config.type === "stat";
  const currentSizeClass = isStat 
    ? "flex-grow basis-auto h-fit min-w-[240px]" 
    : sizeClasses[config.size || "sm"];

  return (
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
      <div className="flex flex-row items-start justify-between gap-2 mb-2 pb-2 border-b border-border/40">
        <div className="flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {config.label}
          </h3>
          {config.description && (
            <p className="text-[10px] text-muted/70 mt-0.5 max-w-[90%] truncate">
              {config.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center w-full mt-2 min-h-0 relative">
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
            config.type === "stat" ? "h-full" : "absolute inset-0 pt-10" 
          )}>
            {config.type === "stat" && typeof parsedData === "number" && (
              <AnimatedStat
                value={parsedData}
                prefix={config.prefix}
                suffix={config.suffix}
                source={sourceLabel}
              />
            )}
            {config.type === "stat" && typeof parsedData !== "number" && (
              <StaticStringStat 
                value={String(parsedData)} 
                prefix={config.prefix}
                suffix={config.suffix}
                source={sourceLabel} 
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
    </motion.div>
  );
}
