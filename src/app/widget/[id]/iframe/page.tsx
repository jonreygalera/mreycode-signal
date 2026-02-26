"use client";

import { use, useMemo } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { dashboardWidgets } from "@/config/dashboard";
import { WidgetCard } from "@/components/dashboard/widget-card";

export default function WidgetIframePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const widget = dashboardWidgets.find((w) => w.id === id);

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
