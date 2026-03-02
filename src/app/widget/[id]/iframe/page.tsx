"use client";

import { useEffect, use, useMemo, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { useTheme } from "next-themes";

function WidgetIframeContent({ params }: { params: Promise<{ id: string }> }) {
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

  const iframeConfig = useMemo(() => {
    if (!widget) return null;
    return {
      ...widget,
      size: 'xl' as const,
    };
  }, [widget]);

  if (!widget) {
    return notFound();
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <div className="flex-1 w-full h-full p-0">
        <WidgetCard config={iframeConfig as any} index={0} />
      </div>
    </div>
  );
}

export default function WidgetIframePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-background animate-pulse" />}>
      <WidgetIframeContent {...props} />
    </Suspense>
  );
}
