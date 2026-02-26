"use client";

import { useEffect, useRef, useState } from "react";
import { WidgetConfig } from "@/types/widget";
import { WidgetCard } from "./widget-card";

export function WidgetGrid({ configs }: { configs: WidgetConfig[] }) {
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
      <div className="flex flex-wrap items-start gap-4">
        {configs.slice(0, visibleCount).map((config, index) => (
          <WidgetCard key={config.id} config={config} index={index} />
        ))}
      </div>
      {visibleCount < configs.length && (
        <div ref={observerRef} className="h-10 w-full" />
      )}
    </div>
  );
}
