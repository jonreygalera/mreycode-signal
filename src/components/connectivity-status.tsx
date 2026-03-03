"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useConnectivity } from "@/context/connectivity-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ConnectivityStatus() {
  const { isOnline } = useConnectivity();

  return (
    <div className="flex items-center" title={isOnline ? "System Online" : "System Offline"}>
      <AnimatePresence mode="wait">
        {isOnline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          >
            <Wifi size={14} />
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center p-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_-5px_#ef4444]"
          >
            <WifiOff size={14} className="animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
