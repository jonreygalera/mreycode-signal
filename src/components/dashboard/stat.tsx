"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { abbreviateNumber } from "@/lib/format";
import { getStatusColor } from "@/lib/color";
import { WidgetConfig } from "@/types/widget";

export function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  source,
  sourceUrl,
  size = "md",
  abbreviate = false,
  color,
  colorRules,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  source?: string;
  sourceUrl?: string;
  size?: "md" | "lg";
  abbreviate?: boolean;
  color?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
  colorRules?: WidgetConfig['colorRules'];
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  const resolvedColor = useMemo(() => {
    return getStatusColor(displayValue, { color, colorRules } as any);
  }, [displayValue, color, colorRules]);

  return (
    <div className={cn(
      "flex flex-col gap-2 w-fit h-full",
      size === "lg" ? "justify-center items-center mx-auto" : "justify-end items-start"
    )}>
      <div className="flex items-baseline gap-1 whitespace-nowrap w-fit">
        {prefix && (
          <span className="text-xl font-semibold text-muted">
            {prefix}
          </span>
        )}
        <motion.span 
          className={cn(
            "font-mono font-medium tracking-tight whitespace-nowrap transition-all duration-300 leading-none",
            size === "lg" ? "text-7xl sm:text-[6rem]" : "text-4xl sm:text-[2.5rem]",
            resolvedColor === 'up' && "text-up",
            resolvedColor === 'down' && "text-down",
            resolvedColor === 'muted' && "text-muted",
            resolvedColor === 'foreground' && "text-foreground",
            resolvedColor === 'warning' && "text-warning",
            resolvedColor === 'info' && "text-info",
            !resolvedColor && "text-foreground"
          )}
        >
          {abbreviate ? abbreviateNumber(displayValue) : displayValue.toLocaleString()}
        </motion.span>
        {suffix && (
          <span className="text-lg font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1 w-max">
        <span className="text-[10px] text-muted tracking-widest uppercase">
          Source:
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted/10 text-muted hover:text-foreground text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide transition-colors cursor-pointer"
          >
            {source}
          </a>
        ) : (
          <span className="bg-muted/10 text-muted text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}

export function StaticStringStat({
  value,
  prefix = "",
  suffix = "",
  source,
  sourceUrl,
  size = "md",
  abbreviate = false,
  color,
  colorRules,
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  source?: string;
  sourceUrl?: string;
  size?: "md" | "lg";
  abbreviate?: boolean;
  color?: 'up' | 'down' | 'muted' | 'foreground' | 'warning' | 'info';
  colorRules?: WidgetConfig['colorRules'];
}) {
  const displayValue = useMemo(() => {
    if (abbreviate && !isNaN(Number(value))) {
      return abbreviateNumber(Number(value));
    }
    return value;
  }, [value, abbreviate]);

  const resolvedColor = useMemo(() => {
    return getStatusColor(value, { color, colorRules } as any);
  }, [value, color, colorRules]);

  return (
    <div className={cn(
      "flex flex-col gap-2 w-fit h-full",
      size === "lg" ? "justify-center items-center mx-auto" : "justify-end items-start"
    )}>
      <div className="flex items-baseline gap-1 whitespace-nowrap w-fit">
        {prefix && (
          <span className="text-xl font-semibold text-muted">
            {prefix}
          </span>
        )}
        <span 
          className={cn(
            "font-mono font-medium tracking-tight whitespace-nowrap transition-all duration-300 leading-none",
            size === "lg" ? "text-7xl sm:text-[6rem]" : "text-4xl sm:text-[2.5rem]",
            resolvedColor === 'up' && "text-up",
            resolvedColor === 'down' && "text-down",
            resolvedColor === 'muted' && "text-muted",
            resolvedColor === 'foreground' && "text-foreground",
            resolvedColor === 'warning' && "text-warning",
            resolvedColor === 'info' && "text-info",
            !resolvedColor && "text-foreground"
          )}
        >
          {displayValue}
        </span>
        {suffix && (
          <span className="text-lg font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1 w-max">
        <span className="text-[10px] text-muted tracking-widest uppercase">
          Source:
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted/10 text-muted hover:text-foreground text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide transition-colors cursor-pointer"
          >
            {source}
          </a>
        ) : (
          <span className="bg-muted/10 text-muted text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}
