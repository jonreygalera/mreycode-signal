"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, AppSettings } from "@/config/settings";
import { useSWRConfig } from "swr";
import { useTVMode } from "./tv-mode-context";
import { useRouter, useSearchParams } from "next/navigation";
import { getWorkspaces } from "@/lib/widgets";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  triggerRefresh: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const { mutate } = useSWRConfig();
  const { isTVMode } = useTVMode();
  const router = useRouter();
  const searchParams = useSearchParams();

  const triggerRefresh = () => {
    // Hard refresh the entire page
    window.location.reload();
  };

  useEffect(() => {
    const stored = localStorage.getItem("app-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("app-settings", JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  // TV Carousel Logic
  useEffect(() => {
    if (!isTVMode || !settings.tvCarouselEnabled || !isInitialized) return;

    const intervalMs = Math.max(30, settings.tvCarouselInterval) * 1000;
    
    const timer = setInterval(() => {
      const workspaces = getWorkspaces();
      const currentWorkspace = searchParams.get("workspace");
      
      // Build a list of all viewable IDs (null for Main, then all workspace IDs)
      const viewList = [null, ...workspaces.map(ws => ws.id)];
      
      const currentIndex = viewList.indexOf(currentWorkspace as any);
      const nextIndex = (currentIndex + 1) % viewList.length;
      const nextWorkspace = viewList[nextIndex];

      const params = new URLSearchParams(searchParams.toString());
      if (nextWorkspace) {
        params.set("workspace", nextWorkspace);
      } else {
        params.delete("workspace");
      }
      
      router.push(`/?${params.toString()}`);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTVMode, settings.tvCarouselEnabled, settings.tvCarouselInterval, isInitialized, searchParams, router]);

  useEffect(() => {
    if (settings.backgroundImage) {
      document.body.classList.add("has-custom-bg");
    } else {
      document.body.classList.remove("has-custom-bg");
    }
  }, [settings.backgroundImage]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings, 
      triggerRefresh
    }}>
      <div className="relative min-h-screen">
        {settings.backgroundImage && (
          <>
            <div 
              className="fixed inset-0 -z-20 pointer-events-none transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${settings.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            />
            <div className="fixed inset-0 bg-background/40 -z-10 pointer-events-none" />
          </>
        )}
        <div className="relative z-0">
          {children}
        </div>
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
