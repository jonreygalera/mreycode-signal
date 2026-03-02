"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  className?: string;
  showLabel?: boolean;
}

export function RefreshButton({ className, showLabel = false }: RefreshButtonProps) {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState(settings.refreshInterval);

  useEffect(() => {
    if (!settings.autoRefresh) {
      setTimeLeft(settings.refreshInterval);
      return;
    }

    // Set initial value
    setTimeLeft(settings.refreshInterval);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.autoRefresh, settings.refreshInterval]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      className={cn(
        "group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all active:scale-95",
        settings.autoRefresh 
          ? "bg-green-500/5 text-green-500 ring-1 ring-green-500/20" 
          : "text-muted hover:text-foreground hover:bg-muted/10",
        className
      )}
      title={settings.autoRefresh ? `Auto-refresh active: ${timeLeft}s remaining` : "Hard Refresh Dashboard"}
    >
      <div className="relative">
        <RotateCcw 
          size={14} 
          className={cn(
            "transition-transform duration-500",
            settings.autoRefresh ? "animate-[spin_4s_linear_infinite]" : "group-hover:rotate-180"
          )} 
        />
        {settings.autoRefresh && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-panel animate-pulse" />
        )}
      </div>
      
      {settings.autoRefresh && (
        <span className="text-[10px] font-bold tabular-nums">
          {timeLeft}s
        </span>
      )}

      {showLabel && !settings.autoRefresh && (
        <span className="text-xs font-semibold uppercase tracking-tight">Refresh</span>
      )}
    </button>
  );
}
