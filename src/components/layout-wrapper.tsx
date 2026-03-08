"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";
import { useTVMode } from "@/context/tv-mode-context";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIframe = pathname?.includes('/iframe');
  const isWidgetPreview = pathname?.startsWith('/widget/preview');
  const { isTVMode } = useTVMode();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('SW registered'))
        .catch((err) => console.log('SW registration failed', err));
    }
  }, []);

  const hideHeader = isTVMode || isWidgetPreview;

  return (
    <div className="relative flex min-h-screen flex-col">
      {!hideHeader && (
        <Suspense fallback={<div className="h-14 border-b border-border bg-panel animate-pulse" />}>
          <Header />
        </Suspense>
      )}
      <main className={cn(
        "mx-auto w-full max-w-7xl flex-1 focus:outline-none",
        isIframe || isTVMode || isWidgetPreview ? "max-w-none px-0 pt-0" : "px-4 pt-[72px] sm:px-6 sm:pt-16 lg:px-8"
      )}>
        <Suspense fallback={<div className="w-full h-screen animate-pulse bg-muted/5" />}>
          {children}
        </Suspense>
      </main>
      {!hideHeader && <BackToTop />}
    </div>
  );
}
