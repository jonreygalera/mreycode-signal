"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function TVModeParamSync({ onSync }: { onSync: (param: boolean) => void }) {
  const searchParams = useSearchParams();
  const tvParam = searchParams.get("tv-mode") === "yes";
  
  useEffect(() => {
    onSync(tvParam);
  }, [tvParam, onSync]);

  return null;
}

interface TVModeContextType {
  isTVMode: boolean;
  toggleTVMode: () => Promise<void>;
}

const TVModeContext = createContext<TVModeContextType | undefined>(undefined);

export function TVModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tvParam, setTvParam] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);

  // Sync state from URL changes via TVModeParamSync
  useEffect(() => {
    setIsTVMode(tvParam);
    
    // Attempt to automatically re-enter fullscreen if TV mode is in URL
    const attemptFullscreen = async () => {
      if (tvParam && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          // This usually fails on refresh due to lack of user gesture
          // We handle this by waiting for the first click below
        }
      }
    };

    attemptFullscreen();

    // Fallback: If fullscreen failed on load, trigger it on first user interaction
    const handleFirstInteraction = async () => {
      if (tvParam && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
          // Remove listener after success
          document.removeEventListener("click", handleFirstInteraction);
        } catch (err) {
          // If it still fails, we keep the listener for the next attempt
        }
      } else {
        document.removeEventListener("click", handleFirstInteraction);
      }
    };

    if (tvParam && !document.fullscreenElement) {
      document.addEventListener("click", handleFirstInteraction);
    }

    return () => document.removeEventListener("click", handleFirstInteraction);
  }, [tvParam]);

  const updateURL = useCallback((enabled: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (enabled) {
      params.set("tv-mode", "yes");
    } else {
      params.delete("tv-mode");
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const toggleTVMode = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        updateURL(true);
      } catch (err) {
        console.error(`Error attempting to enable fullscreen: ${err}`);
        // Even if browser fullscreen fails, we still enable the TV UI
        updateURL(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        updateURL(false);
      }
    }
  }, [updateURL]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const enabled = !!document.fullscreenElement;
      setIsTVMode(enabled || tvParam);
      // Only remove the param if we explicitly exited fullscreen AND the param was there
      if (!enabled && !document.fullscreenElement && !tvParam) {
        updateURL(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [updateURL, tvParam]);

  return (
    <TVModeContext.Provider value={{ isTVMode, toggleTVMode }}>
      <Suspense fallback={null}>
        <TVModeParamSync onSync={setTvParam} />
      </Suspense>
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
