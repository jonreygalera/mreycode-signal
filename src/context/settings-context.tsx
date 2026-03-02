"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AppSettings, DEFAULT_SETTINGS } from "@/config/settings";
import { useSWRConfig } from "swr";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  timeLeft: number;
  triggerRefresh: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.refreshInterval);
  const { mutate } = useSWRConfig();

  const triggerRefresh = () => {
    // Revalidate everything tracking the SWR global cache
    mutate(() => true, undefined, { revalidate: true });
    setTimeLeft(settings.refreshInterval);
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

  useEffect(() => {
    if (!settings.autoRefresh) {
      setTimeLeft(settings.refreshInterval);
      return;
    }

    // Reset timer when initial value changes
    setTimeLeft(settings.refreshInterval);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return settings.refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.autoRefresh, settings.refreshInterval]);

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
      timeLeft, 
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
