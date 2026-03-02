"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface TVModeContextType {
  isTVMode: boolean;
  toggleTVMode: () => Promise<void>;
}

const TVModeContext = createContext<TVModeContextType | undefined>(undefined);

export function TVModeProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvParam = searchParams.get("tv-mode") === "yes";
  
  const [isTVMode, setIsTVMode] = useState(false);

  // Sync state from URL on mount
  useEffect(() => {
    if (tvParam) {
      setIsTVMode(true);
    }
  }, []);

  const updateURL = useCallback((enabled: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (enabled) {
      params.set("tv-mode", "yes");
    } else {
      params.delete("tv-mode");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const toggleTVMode = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsTVMode(true);
        updateURL(true);
      } catch (err) {
        console.error(`Error attempting to enable fullscreen: ${err}`);
        // Still enable TV UI mode even if fullscreen fails
        setIsTVMode(true);
        updateURL(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsTVMode(false);
        updateURL(false);
      }
    }
  }, [updateURL]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const enabled = !!document.fullscreenElement;
      setIsTVMode(enabled);
      updateURL(enabled);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [updateURL]);

  return (
    <TVModeContext.Provider value={{ isTVMode, toggleTVMode }}>
      {children}
    </TVModeContext.Provider>
  );
}

export function useTVMode() {
  const context = useContext(TVModeContext);
  if (context === undefined) {
    throw new Error("useTVMode must be used within a TVModeProvider");
  }
  return context;
}
