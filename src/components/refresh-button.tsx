"use client";

import { RotateCcw } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  className?: string;
  showLabel?: boolean;
}

export function RefreshButton({ className, showLabel = false }: RefreshButtonProps) {
  const { triggerRefresh } = useSettings();

  const handleRefresh = () => {
    triggerRefresh();
  };

  return (
    <button
      onClick={handleRefresh}
      className={cn(
        "group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all active:scale-95 text-muted hover:text-foreground hover:bg-muted/10",
        className
      )}
      title="Hard Refresh Dashboard"
    >
      <div className="relative">
        <RotateCcw 
          size={14} 
          className="transition-transform duration-500 group-hover:rotate-180" 
        />
      </div>
      
      {showLabel && (
        <span className="text-xs font-semibold uppercase tracking-tight">Refresh</span>
      )}
    </button>
  );
}
