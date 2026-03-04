"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectivityContextType {
  isOnline: boolean;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
});

export const useConnectivity = () => useContext(ConnectivityContext);

interface ConnectivityProviderProps {
  children: React.ReactNode;
}

export function ConnectivityProvider({ children }: ConnectivityProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<"online" | "offline">("online");

  useEffect(() => {
    // Initial check
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setNotificationType("online");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNotificationType("offline");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline }}>
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
