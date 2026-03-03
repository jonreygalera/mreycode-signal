"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ActiveSignal, SignalConfig } from "@/types/signal";
import { WidgetConfig } from "@/types/widget";

interface SignalContextType {
  activeSignals: ActiveSignal[];
  tripSignal: (widget: WidgetConfig, signal: SignalConfig, value: number) => void;
  dismissSignal: (widgetId: string, signalId: string) => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [activeSignals, setActiveSignals] = useState<ActiveSignal[]>([]);

  const [lastTrips, setLastTrips] = useState<Record<string, number>>({});

  const tripSignal = useCallback((widget: WidgetConfig, signal: SignalConfig, value: number) => {
    const tripKey = `${widget.id}-${signal.id}`;
    const now = Date.now();

    // Cooldown check
    if (signal.cooldown && lastTrips[tripKey]) {
      const waitTime = signal.cooldown * 60 * 1000;
      if (now - lastTrips[tripKey] < waitTime) return;
    }

    setActiveSignals((prev) => {
      // Check if current session already has this active (to avoid dupe pulses)
      if (prev.some((as) => as.widgetId === widget.id && as.signalId === signal.id)) {
        return prev;
      }

      setLastTrips(prevTrips => ({ ...prevTrips, [tripKey]: now }));

      const newSignal: ActiveSignal = {
        widgetId: widget.id,
        signalId: signal.id,
        timestamp: now,
        value,
      };

      // Notification Logic
      if (signal.action.includes("notify")) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Signal Trip: ${widget.label}`, {
            body: `${signal.label} triggered by value ${value}`,
            icon: "/favicon.ico",
          });
        }
      }

      // Sound Logic
      if (signal.action.includes("sound")) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
      }

      return [...prev, newSignal];
    });
  }, [lastTrips]);

  const dismissSignal = useCallback((widgetId: string, signalId: string) => {
    setActiveSignals((prev) => 
      prev.filter((as) => !(as.widgetId === widgetId && as.signalId === signalId))
    );
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <SignalContext.Provider value={{ activeSignals, tripSignal, dismissSignal }}>
      {children}
    </SignalContext.Provider>
  );
}

export const useSignals = () => {
  const context = useContext(SignalContext);
  if (!context) throw new Error("useSignals must be used within SignalProvider");
  return context;
};
