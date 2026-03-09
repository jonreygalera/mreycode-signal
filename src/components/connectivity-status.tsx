"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useConnectivity } from "@/context/connectivity-context";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ConnectivityStatus() {
  const { isOnline, latency, nextPingProgress } = useConnectivity();
  const { settings } = useSettings();

  const getStatusColor = (ms: number | null) => {
    if (ms === null) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (ms <= settings.connectivityThresholdExcellent) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (ms <= settings.connectivityThresholdGood) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (ms <= settings.connectivityThresholdAverage) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    if (ms <= settings.connectivityThresholdSlow) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const statusColor = getStatusColor(latency);
  const tooltip = isOnline 
    ? `System Online${latency !== null ? ` (${latency}ms)` : ''}` 
    : "System Offline";

  // Circle progress calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (nextPingProgress * circumference);

  return (
    <div className="flex items-center relative group" title={tooltip}>
      {/* Circle Progress Indicator */}
      {isOnline && (
        <svg className="absolute -inset-1 w-10 h-10 -rotate-90 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-300 ease-linear", statusColor.split(' ')[0])}
          />
        </svg>
      )}

      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center p-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_-5px_#ef4444]"
          >
            <WifiOff size={14} className="animate-pulse" />
          </motion.div>
        ) : settings.connectivityMode === 'numeric' ? (
          <motion.div
            key="numeric"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn(
              "z-10 flex items-center justify-center w-8 h-8 rounded-full border transition-colors text-[9px] font-mono font-black",
              statusColor
            )}
          >
            {latency !== null ? `${Math.min(999, latency)}` : '...'}
          </motion.div>
        ) : (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "z-10 flex items-center justify-center p-2 rounded-full border transition-colors",
              statusColor
            )}
          >
            <Wifi size={14} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
