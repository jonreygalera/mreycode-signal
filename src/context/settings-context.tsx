"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  moveCarousel: (direction: "next" | "prev") => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function SettingsInner({ 
  children, 
  settings, 
  updateSettings, 
  resetSettings, 
  triggerRefresh, 
  timeLeft,
  onTimeUpdate
}: any) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { isTVMode } = useTVMode();

  const moveCarousel = useCallback((direction: "next" | "prev") => {
    const workspaces = getWorkspaces();
    const currentWorkspace = searchParams.get("workspace");
    
    // EXCLUDE Main (null) from the carousel loop if we have actual workspaces
    const viewList: (string | null)[] = workspaces.length > 0 
      ? workspaces.map(ws => ws.id) 
      : [null];
    
    let currentIndex = viewList.indexOf(currentWorkspace);
    let nextIndex;

    if (currentIndex === -1) {
      // If we are currently on Main (which is excluded), jump to the first/last workspace
      nextIndex = direction === "next" ? 0 : viewList.length - 1;
    } else {
      if (direction === "next") {
        nextIndex = (currentIndex + 1) % viewList.length;
      } else {
        nextIndex = (currentIndex - 1 + viewList.length) % viewList.length;
      }
    }
    
    const nextWorkspace = viewList[nextIndex];

    const params = new URLSearchParams(searchParams.toString());
    
    // Explicitly preserve or set tv-mode if we are in TV mode
    if (isTVMode) {
      params.set("tv-mode", "yes");
    }

    if (nextWorkspace) {
      params.set("workspace", nextWorkspace);
    } else {
      params.delete("workspace");
    }
    
    router.push(`/?${params.toString()}`);
  }, [searchParams, router, isTVMode]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings, 
      triggerRefresh,
      timeLeft,
      moveCarousel
    }}>
      <div className="relative min-h-screen">
        <Suspense fallback={null}>
          <SettingsSync 
            isTVMode={useTVMode().isTVMode} 
            settings={settings} 
            isInitialized={true} 
            onTimeUpdate={onTimeUpdate}
            onMove={moveCarousel}
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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { isTVMode } = useTVMode();

  const triggerRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    const initStorage = async () => {
      // 1. Load basic bootstrap settings from LocalStorage
      const stored = localStorage.getItem("app-settings");
      let currentSettings = { ...DEFAULT_SETTINGS };
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          currentSettings = { ...currentSettings, ...parsed };
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }

      // 2. Initialize Adapter
      if (currentSettings.storageType === 'supabase' && currentSettings.supabaseConfig.isConfigured) {
        try {
          const { url, key } = currentSettings.supabaseConfig;
          const { SupabaseAdapter } = await import("@/lib/supabase-adapter");
          const { setStorageAdapter } = await import("@/lib/widgets");
          const { decodeCredential } = await import("@/lib/supabase");
          
          setStorageAdapter(new SupabaseAdapter());
          
          // 3. Load Supabase settings
          const adapter = new SupabaseAdapter();
          const supabaseSettings = await adapter.getSettings();
          
          // Merge (Supabase settings take priority for shared keys)
          currentSettings = { ...currentSettings, ...supabaseSettings };
        } catch (e) {
          console.error("Failed to initialize Supabase adapter", e);
        }
      }

      setSettings(currentSettings);
      setIsInitialized(true);
    };

    initStorage();
  }, []);

  useEffect(() => {
    if (isInitialized && settings.storageType === 'supabase' && settings.supabaseConfig.isConfigured) {
      import("@/lib/widgets").then(({ getStorageAdapter }) => {
        const adapter = getStorageAdapter();
        if (adapter.onDataChange) {
          adapter.onDataChange(() => {
            console.log("Realtime update detected, refreshing data...");
            // Use triggerRefresh or a more subtle way to reload the specific SWR keys if needed
            // For now, simple reload as per "no need to refresh page" (meaning manual refresh)
            window.location.reload();
          }, settings.supabaseRealtimeEnabled);
        }
      });
    }
  }, [isInitialized, settings.storageType, settings.supabaseConfig.isConfigured, settings.supabaseRealtimeEnabled]);

  useEffect(() => {
    if (isInitialized) {
      // Save specific settings to LocalStorage
      const localOnly = {
        storageType: settings.storageType,
        supabaseConfig: settings.supabaseConfig,
        backgroundImage: settings.backgroundImage,
        useBgInClock: settings.useBgInClock,
        localStorageThreshold: settings.localStorageThreshold,
      };
      localStorage.setItem("app-settings", JSON.stringify({ ...settings, ...localOnly }));

      // Save shared settings to Supabase if active
      if (settings.storageType === 'supabase' && settings.supabaseConfig.isConfigured) {
        const sharedSettings = {
          timezone: settings.timezone,
          tvCarouselEnabled: settings.tvCarouselEnabled,
          tvCarouselInterval: settings.tvCarouselInterval,
          snackbarPosition: settings.snackbarPosition,
          maximizedCarouselEnabled: settings.maximizedCarouselEnabled,
          maximizedCarouselInterval: settings.maximizedCarouselInterval,
        };
        
        // Non-blocking save
        import("@/lib/widgets").then(({ getStorageAdapter }) => {
          const adapter = getStorageAdapter();
          adapter.saveSettings(sharedSettings).catch(console.error);
        });
      }
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
    <Suspense fallback={null}>
      <SettingsInner 
        settings={settings} 
        updateSettings={updateSettings} 
        resetSettings={resetSettings} 
        triggerRefresh={triggerRefresh}
        timeLeft={timeLeft}
        onTimeUpdate={setTimeLeft} // Pass this down
      >
        {children}
      </SettingsInner>
    </Suspense>
  );
}

function SettingsSync({ 
  isTVMode, 
  settings, 
  isInitialized,
  onTimeUpdate,
  onMove
}: { 
  isTVMode: boolean, 
  settings: AppSettings, 
  isInitialized: boolean,
  onTimeUpdate: (time: number | null) => void,
  onMove: (direction: "next" | "prev") => void
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (!isTVMode || !isInitialized) {
      onTimeUpdate(null);
      return;
    }

    const totalSeconds = Math.max(30, settings.tvCarouselInterval);
    let remaining = totalSeconds;
    
    // Always handle keyboard navigation in TV mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight") {
        onMove("next");
        remaining = totalSeconds; // Reset timer on manual move
        onTimeUpdate(remaining);
      } else if (e.key === "ArrowLeft") {
        onMove("prev");
        remaining = totalSeconds; // Reset timer on manual move
        onTimeUpdate(remaining);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Only start timer if enabled
    let timer: any = null;
    if (settings.tvCarouselEnabled) {
      onTimeUpdate(remaining);
      timer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          onMove("next");
          remaining = totalSeconds;
        }
        onTimeUpdate(remaining);
      }, 1000);
    } else {
      onTimeUpdate(null);
    }

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTVMode, settings.tvCarouselEnabled, settings.tvCarouselInterval, isInitialized, onTimeUpdate, onMove]);

  return null;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
