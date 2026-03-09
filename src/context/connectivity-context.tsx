"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "./settings-context";

interface ConnectivityContextType {
  isOnline: boolean;
  latency: number | null;
  nextPingProgress: number;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  latency: null,
  nextPingProgress: 0,
});

export const useConnectivity = () => useContext(ConnectivityContext);

interface ConnectivityProviderProps {
  children: React.ReactNode;
}

export function ConnectivityProvider({ children }: ConnectivityProviderProps) {
  const { settings } = useSettings();
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [nextPingProgress, setNextPingProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<"online" | "offline">("online");
  const lastOnlineStatus = useRef(true);
  const lastPingTime = useRef(Date.now());

  const triggerNotification = (status: boolean) => {
    if (status !== lastOnlineStatus.current) {
      setNotificationType(status ? "online" : "offline");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      lastOnlineStatus.current = status;
    }
  };

  useEffect(() => {
    // Basic navigator status for immediate feedback
    const initialStatus = window.navigator.onLine;
    setIsOnline(initialStatus);
    lastOnlineStatus.current = initialStatus;

    const handleOnline = () => {
      setIsOnline(true);
      triggerNotification(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLatency(null);
      triggerNotification(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Ping check loop
    let intervalId: NodeJS.Timeout;
    let progressIntervalId: NodeJS.Timeout;

    const performPing = async () => {
      if (!window.navigator.onLine) {
        setLatency(null);
        return;
      }

      const start = performance.now();
      try {
        const cacheBuster = `&_cb=${Date.now()}`;
        const urlToFetch = settings.connectivityUrl.includes('?') 
          ? `${settings.connectivityUrl}${cacheBuster}`
          : `${settings.connectivityUrl}?${cacheBuster.substring(1)}`;

        const response = await fetch(urlToFetch, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });

        const end = performance.now();
        const rtt = Math.round(end - start);
        
        setLatency(rtt);
        setIsOnline(true);
        triggerNotification(true);
        lastPingTime.current = Date.now();
      } catch (error) {
        console.error("Ping failed:", error);
        setLatency(null);
        if (!window.navigator.onLine) {
          setIsOnline(false);
          triggerNotification(false);
        }
      }
    };

    // Progress update loop (every 100ms for smoothness)
    progressIntervalId = setInterval(() => {
      const elapsed = Date.now() - lastPingTime.current;
      const total = settings.connectivityEvery * 1000;
      const progress = Math.min(1, elapsed / total);
      setNextPingProgress(progress);
    }, 100);

    // Initial ping
    performPing();

    intervalId = setInterval(performPing, settings.connectivityEvery * 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
      clearInterval(progressIntervalId);
    };
  }, [settings.connectivityUrl, settings.connectivityEvery]);

  return (
    <ConnectivityContext.Provider value={{ isOnline, latency, nextPingProgress }}>
      {children}
      
      {/* Global Connectivity Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-4 left-1/2 z-200 w-full max-w-[320px]"
          >
            <div className={cn(
              "mx-4 p-4 rounded-lg shadow-2xl backdrop-blur-md border flex items-center gap-3",
              notificationType === "online" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
              <div className={cn(
                "p-2 rounded-full",
                notificationType === "online" ? "bg-emerald-500/20" : "bg-red-500/20"
              )}>
                {notificationType === "online" ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest">
                  {notificationType === "online" ? "Back to Online" : "You are Offline"}
                </p>
                <p className="text-[10px] opacity-70 font-medium">
                  {notificationType === "online" 
                    ? "Connection restored successfully." 
                    : "Some features may be limited."}
                </p>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="p-1 hover:bg-black/5 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence Status Indicator (Bottom Right) */}
      <div className="fixed bottom-8 right-24 z-100 pointer-events-none">

        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-500/20 border border-white/20"
            >
              <WifiOff size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Offline Mode</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ConnectivityContext.Provider>
  );
}
