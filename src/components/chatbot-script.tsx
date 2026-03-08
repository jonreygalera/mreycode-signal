"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function ChatbotScript() {
  const pathname = usePathname();
  const isPreview = pathname?.startsWith('/widget/preview') || pathname?.includes('/iframe');

  if (isPreview) return null;

  return (
    <Script 
      src="https://mrey-ai.vercel.app/js/embed-mreyagent.js?agentName=mreycode-signal-kb" 
      strategy="afterInteractive"
    />
  );
}
