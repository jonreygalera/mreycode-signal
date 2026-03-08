"use client";

import { use, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { useTheme } from "next-themes";
import { searchParamsToConfig } from "@/lib/widget-url";
import { WidgetConfig } from "@/types/widget";

function WidgetPreviewContent() {
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();
  
  const themeParam = searchParams.get('theme') || 'dark';
  const minimalParam = searchParams.get('minimal') === 'true';
  const maximizedParam = searchParams.get('maximized') === 'true';
  
  const config = useMemo(() => {
    const rawConfig = searchParamsToConfig(searchParams);
    return {
      ...rawConfig,
      size: (rawConfig.size || 'xl') as any, // Default to xl for standalone preview
      isTemp: true // Mark as temp to prevent it from trying to save or anything
    } as WidgetConfig;
  }, [searchParams]);

  useEffect(() => {
    if (themeParam === 'light' || themeParam === 'dark') {
      setTheme(themeParam);
    }
  }, [themeParam, setTheme]);

  if (!config.id || !config.type) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-muted text-xs uppercase tracking-widest font-bold">Widget Preview</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            Provide widget configuration via URL parameters to see a preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <div className="flex-1 w-full h-full p-0">
        <WidgetCard 
          config={config} 
          index={0} 
          minimal={minimalParam} 
          readOnly={true} 
          isMaximized={maximizedParam}
        />
      </div>
    </div>
  );
}

export default function WidgetPreviewPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-background animate-pulse" />}>
      <WidgetPreviewContent />
    </Suspense>
  );
}
