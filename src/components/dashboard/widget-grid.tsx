"use client";

import { useEffect, useRef, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { WidgetCard } from "./widget-card";

export function WidgetGrid({ 
  configs, 
  onEdit, 
  onDelete,
  onCopy,
  maximizedWidgetId,
  onMaximizeChange
}: { 
  configs: WidgetConfig[]; 
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopy?: (config: WidgetConfig) => void;
  maximizedWidgetId?: string | null;
  onMaximizeChange?: (id: string | null) => void;
}) {
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
            key={config.id} 
            config={config} 
            allConfigs={configs}
            index={index} 
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
            isMaximized={config.id === maximizedWidgetId}
            onMaximize={(max) => onMaximizeChange?.(typeof max === 'string' ? max : (max ? config.id : null))}
          />
        ))}
        {/* Ensure the maximized widget is ALWAYS rendered so its fixed overlay is visible 
            even if it's not in the initial visible slice */}
        {maximizedWidgetId && !configs.slice(0, visibleCount).some(c => c.id === maximizedWidgetId) && (
          configs.filter(c => c.id === maximizedWidgetId).map((config, index) => (
            <div key={config.id} className="hidden">
              <WidgetCard 
                config={config} 
                allConfigs={configs}
                index={index} 
                isMaximized={true}
                onMaximize={(max) => onMaximizeChange?.(typeof max === 'string' ? max : (max ? config.id : null))}
              />
            </div>
          ))
        )}
      </div>
      {visibleCount < configs.length && (
        <div ref={observerRef} className="h-10 w-full" />
      )}
    </div>
  );
}
