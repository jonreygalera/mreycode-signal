"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, Info, X } from "lucide-react";
import { ActiveSignal, SignalConfig } from "@/types/signal";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app";
import { useSettings } from "./settings-context";

interface Snackbar {
  id: string;
  title: string;
  message: string;
  duration: number;
}

interface SignalContextType {
  activeSignals: ActiveSignal[];
  snackbars: Snackbar[];
  tripSignal: (widget: WidgetConfig, signal: SignalConfig, value: number) => void;
  dismissSignal: (widgetId: string, signalId: string) => void;
  removeSnackbar: (id: string) => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [activeSignals, setActiveSignals] = useState<ActiveSignal[]>([]);
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);

  const [lastTrips, setLastTrips] = useState<Record<string, number>>({});
  const activeActionKeys = useRef<Set<string>>(new Set());

  const tripSignal = useCallback((widget: WidgetConfig, signal: SignalConfig, value: number) => {
    const tripKey = `${widget.id}-${signal.id}`;
    const now = Date.now();

    // 1. Cooldown check
    if (signal.cooldown && lastTrips[tripKey]) {
      const waitTime = signal.cooldown * 60 * 1000;
      if (now - lastTrips[tripKey] < waitTime) return;
    }

    // 2. Already acting check (prevents double triggers in Strict Mode or rapid refreshes)
    if (activeActionKeys.current.has(tripKey)) return;
    activeActionKeys.current.add(tripKey);

    // 3. side effects (Safe here because we guarded with Ref)
    setLastTrips(prevTrips => ({ ...prevTrips, [tripKey]: now }));

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
      const audio = new Audio(appConfig.signalSound);
      audio.play().catch(() => {});
    }

    // In-App Notification Logic
    if (signal.action.includes("notify-in-app")) {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = signal.duration || appConfig.defaultSignalDuration;
      
      setSnackbars(prev => [...prev, {
        id,
        title: widget.label,
        message: `${signal.label} (Value: ${value})`,
        duration
      }]);

      setTimeout(() => {
        setSnackbars(prev => prev.filter(s => s.id !== id));
      }, duration * 1000);
    }

    // 4. Update the visual state
    setActiveSignals((prev) => {
      if (prev.some((as) => as.widgetId === widget.id && as.signalId === signal.id)) {
        return prev;
      }

      return [...prev, {
        widgetId: widget.id,
        signalId: signal.id,
        timestamp: now,
        value,
      }];
    });
  }, [lastTrips]);

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  }, []);

  const dismissSignal = useCallback((widgetId: string, signalId: string) => {
    const tripKey = `${widgetId}-${signalId}`;
    activeActionKeys.current.delete(tripKey);
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

  const { settings } = useSettings();

  const getPositionClasses = () => {
    switch (settings.snackbarPosition) {
      case 'top-left': return "top-6 left-6 items-start";
      case 'top-center': return "top-6 left-1/2 -translate-x-1/2 items-center";
      case 'top-right': return "top-6 right-6 items-end";
      case 'bottom-left': return "bottom-6 left-6 items-start";
      case 'bottom-center': return "bottom-6 left-1/2 -translate-x-1/2 items-center";
      case 'bottom-right': return "bottom-6 right-6 items-end";
      default: return "top-6 right-6 items-end";
    }
  };

  const getAnimationProps = () => {
    const pos = settings.snackbarPosition;
    if (pos.includes('left')) return { initial: { opacity: 0, x: -20, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 } };
    if (pos.includes('right')) return { initial: { opacity: 0, x: 20, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 } };
    if (pos.includes('top')) return { initial: { opacity: 0, y: -20, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 } };
    return { initial: { opacity: 0, y: 20, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 } };
  };

  return (
    <SignalContext.Provider value={{ activeSignals, snackbars, tripSignal, dismissSignal, removeSnackbar }}>
      {children}
      
      {/* Snackbar Container */}
      <div className={cn("fixed z-9999 flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4", getPositionClasses())}>
        <AnimatePresence mode="popLayout">
          {snackbars.map((snack) => (
            <motion.div
              key={snack.id}
              layout
              {...getAnimationProps()}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="pointer-events-auto group relative w-full bg-panel/80 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl shadow-black/40 overflow-hidden"
            >
              {/* Progress bar */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: snack.duration, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-red-500/50"
              />
              
              <div className="p-4 flex gap-3">
                <div className="mt-0.5 p-2 rounded-md bg-red-500/10 text-red-500 shrink-0">
                  <Bell size={16} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted/60 mb-0.5">
                    {snack.title}
                  </h4>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {snack.message}
                  </p>
                </div>
                <button 
                  onClick={() => removeSnackbar(snack.id)}
                  className="absolute top-4 right-4 text-muted/40 hover:text-foreground transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SignalContext.Provider>
  );
}

export const useSignals = () => {
  const context = useContext(SignalContext);
  if (!context) throw new Error("useSignals must be used within SignalProvider");
  return context;
};
