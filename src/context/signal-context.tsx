"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, Info, X } from "lucide-react";
import { ActiveSignal, SignalConfig } from "@/types/signal";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app";
import { useSettings } from "./settings-context";
import { getStorageUsage } from "@/lib/storage-utils";

interface Snackbar {
  id: string;
  title: string;
  message: string;
  duration: number;
  isPersistent?: boolean;
}

interface SignalContextType {
  activeSignals: ActiveSignal[];
  snackbars: Snackbar[];
  tripSignal: (widget: WidgetConfig, signal: SignalConfig, value: number) => void;
  dismissSignal: (widgetId: string, signalId: string) => void;
  addSnackbar: (snack: Omit<Snackbar, "id">) => void;
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
      const duration = signal.duration || appConfig.defaultSignalDuration;
      addSnackbar({
        title: widget.label,
        message: `${signal.label} (Value: ${value})`,
        duration
      });
    }

    // Webhook Logic
    if (signal.action.includes("webhook") && signal.webhook) {
      const { url, method, headers, body } = signal.webhook;
      
      const processedBody = body 
        ? body.replace(/{{value}}/g, value.toString())
              .replace(/{{label}}/g, signal.label)
              .replace(/{{widget}}/g, widget.label)
        : JSON.stringify({
            signal: signal.label,
            widget: widget.label,
            value: value,
            timestamp: now
          });

      let finalHeaders = {};
      try {
        finalHeaders = typeof headers === 'string' ? JSON.parse(headers) : (headers || {});
      } catch (e) {
        console.warn('Failed to parse webhook headers:', e);
      }

      fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...finalHeaders
        },
        body: method !== 'GET' ? processedBody : undefined
      }).catch(err => {
        console.error('Webhook failed:', err);
        addSnackbar({
          title: "Webhook Error",
          message: `Failed to trigger webhook for ${signal.label}`,
          duration: 5
        });
      });
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

  const addSnackbar = useCallback((snack: Omit<Snackbar, "id">, explicitId?: string) => {
    const id = explicitId || Math.random().toString(36).substring(2, 9);
    
    setSnackbars(prev => {
      // If explicitId is provided, don't duplicate
      if (explicitId && prev.some(s => s.id === explicitId)) return prev;
      return [...prev, { ...snack, id }];
    });
    
    if (!snack.isPersistent) {
      setTimeout(() => {
        setSnackbars(prev => prev.filter(s => s.id !== id));
      }, snack.duration * 1000);
    }
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
  const hasAlertedRef = useRef<boolean>(false);

  // Storage Usage Check
  useEffect(() => {
    const STORAGE_SNACKBAR_ID = "storage-warning-alert";
    
    const checkStorage = () => {
      const usage = getStorageUsage();
      const threshold = settings.localStorageThreshold || 90;
      
      if (usage.percentage >= threshold) {
        addSnackbar({
          title: "Storage Limit Warning",
          message: `Your browser storage is at ${usage.percentage}% capacity. Clear some data or export a backup.`,
          duration: 0,
          isPersistent: true
        }, STORAGE_SNACKBAR_ID);
      } else {
        removeSnackbar(STORAGE_SNACKBAR_ID);
      }
    };

    // Check on mount and every 30 seconds
    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, [settings.localStorageThreshold, addSnackbar, removeSnackbar]);

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
    <SignalContext.Provider value={{ activeSignals, snackbars, tripSignal, dismissSignal, addSnackbar, removeSnackbar }}>
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
              {!snack.isPersistent && (
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: snack.duration, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-0.5 bg-red-500/50"
                />
              )}
              
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
