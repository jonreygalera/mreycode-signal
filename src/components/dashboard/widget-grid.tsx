"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { WidgetCard } from "./widget-card";
import { useSettings } from "@/context/settings-context";

export function WidgetGrid({ 
  configs, 
  onEdit, 
  onDelete,
  maximizedWidgetId,
  onMaximizeChange
}: { 
  configs: WidgetConfig[]; 
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  maximizedWidgetId?: string | null;
  onMaximizeChange?: (id: string | null) => void;
}) {
  const { refreshKey } = useSettings();
  const [visibleCount, setVisibleCount] = useState(6);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < configs.length) {
          setVisibleCount((prev) => Math.min(prev + 4, configs.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [configs.length, visibleCount]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap items-stretch gap-4">
        {configs.slice(0, visibleCount).map((config, index) => (
          <WidgetCard 
            key={config.id + (config.refreshInterval ? "" : `-${refreshKey}`)} 
            config={config} 
            index={index} 
            onEdit={onEdit}
            onDelete={onDelete}
            isMaximized={config.id === maximizedWidgetId}
            onMaximize={(max) => onMaximizeChange?.(max ? config.id : null)}
          />
        ))}
      </div>
      {visibleCount < configs.length && (
        <div ref={observerRef} className="h-10 w-full" />
      )}
    </div>
  );
}
