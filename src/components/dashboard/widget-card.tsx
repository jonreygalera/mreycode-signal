"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { WidgetConfig } from "@/types/widget";
import { getNestedProperty, cn } from "@/lib/utils";
import { AnimatedStat } from "./stat";
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
    }
  );

  const parsedData = useMemo(() => {
    if (!data) return null;
    return getNestedProperty(data, config.responsePath);
  }, [data, config.responsePath]);

  // Map size to Flex widths for charts (charts need constraints)
  const sizeClasses = {
    sm: "w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33%-0.75rem)] min-w-[300px]",
    md: "w-full md:w-[calc(50%-0.5rem)] min-w-[400px]",
    lg: "w-full lg:w-[calc(66%-1rem)] min-h-[300px]",
    xl: "w-full min-h-[400px]",
  };

  const isStat = config.type === "stat";
  const currentSizeClass = isStat 
    ? "flex-none w-fit h-fit min-w-[240px]" 
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

      <div className="flex flex-1 items-center justify-center min-h-[100px] w-full mt-2">
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
          <div className="flex h-full w-full flex-col justify-end">
            {config.type === "stat" && typeof parsedData === "number" && (
              <AnimatedStat
                value={parsedData}
                prefix={config.prefix}
                suffix={config.suffix}
              />
            )}
            {config.type === "stat" && typeof parsedData !== "number" && (
              <span 
                className="font-mono text-4xl sm:text-[2.5rem] tracking-tight text-foreground whitespace-nowrap transition-all duration-300 leading-none"
              >
                {String(parsedData)}
              </span>
            )}
            {config.type === "line" && Array.isArray(parsedData) && (
              <WidgetLineChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                className="mt-4"
              />
            )}
            {config.type === "area" && Array.isArray(parsedData) && (
              <WidgetAreaChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                className="mt-4"
              />
            )}
            {config.type === "bar" && Array.isArray(parsedData) && (
              <WidgetBarChart
                data={parsedData}
                xKey={config.xKey || ""}
                yKey={config.yKey || ""}
                prefix={config.prefix}
                className="mt-4"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
