"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIframe = pathname?.includes('/iframe');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('SW registered'))
        .catch((err) => console.log('SW registration failed', err));
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className={cn(
        "mx-auto w-full max-w-7xl flex-1 focus:outline-none",
        isIframe ? "max-w-none px-0 pt-0" : "px-4 pt-16 sm:px-6 lg:px-8"
      )}>
        {children}
      </main>
      <BackToTop />
    </div>
  );
}
