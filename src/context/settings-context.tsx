"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, AppSettings } from "@/config/settings";
import { useSWRConfig } from "swr";
import { useTVMode } from "./tv-mode-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getWorkspaces } from "@/lib/widgets";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  triggerRefresh: () => void;
  timeLeft: number | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { isTVMode } = useTVMode();

  const triggerRefresh = () => {
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
      triggerRefresh,
      timeLeft
    }}>
      <div className="relative min-h-screen">
        <Suspense fallback={null}>
          <SettingsSync 
            isTVMode={isTVMode} 
            settings={settings} 
            isInitialized={isInitialized} 
            onTimeUpdate={setTimeLeft}
          />
        </Suspense>
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

function SettingsSync({ 
  isTVMode, 
  settings, 
  isInitialized,
  onTimeUpdate
}: { 
  isTVMode: boolean, 
  settings: AppSettings, 
  isInitialized: boolean,
  onTimeUpdate: (time: number | null) => void
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    if (!isTVMode || !settings.tvCarouselEnabled || !isInitialized) {
      onTimeUpdate(null);
      return;
    }

    const totalSeconds = Math.max(30, settings.tvCarouselInterval);
    let remaining = totalSeconds;
    
    onTimeUpdate(remaining);

    const timer = setInterval(() => {
      remaining -= 1;
      
      if (remaining <= 0) {
        const workspaces = getWorkspaces();
        const currentWorkspace = searchParams.get("workspace");
        
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
        remaining = totalSeconds;
      }
      
      onTimeUpdate(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTVMode, settings.tvCarouselEnabled, settings.tvCarouselInterval, isInitialized, searchParams, router, onTimeUpdate]);

  return null;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
