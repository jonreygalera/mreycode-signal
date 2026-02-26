"use client";

import { useEffect, use, useMemo } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { useTheme } from "next-themes";

export default function WidgetIframePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();
  
  const themeParam = searchParams.get('theme') || 'dark';
  const widget = dashboardWidgets.find((w) => w.id === id);

  useEffect(() => {
    if (themeParam === 'light' || themeParam === 'dark') {
      setTheme(themeParam);
    }
  }, [themeParam, setTheme]);

  if (!widget) {
    return notFound();
  }

  // Force certain settings for iframe mode
  const iframeConfig = useMemo(() => ({
    ...widget,
    size: 'xl' as const, // Force XL size to take full container
  }), [widget]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <div className="flex-1 w-full h-full p-0">
        <WidgetCard config={iframeConfig} index={0} />
      </div>
    </div>
  );
}
