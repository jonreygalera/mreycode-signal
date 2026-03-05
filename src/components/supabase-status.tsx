"use client";

import { Database } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SupabaseStatus() {
  const { settings } = useSettings();
  const isSupabase = settings.storageType === 'supabase';
  const isConfigured = settings.supabaseConfig.isConfigured;

  if (!isSupabase) return null;

  return (
    <div className="flex items-center" title={isConfigured ? "Connected to Supabase Cloud" : "Supabase Selected but not Configured"}>
      <AnimatePresence mode="wait">
        <motion.div
          key="supabase-active"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "flex items-center justify-center p-2 rounded-full border transition-all",
            isConfigured 
              ? "bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20 shadow-[0_0_10px_-2px_#3ecf8e50]" 
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          )}
        >
          <Database size={14} fill="currentColor" fillOpacity={isConfigured ? 0.2 : 0} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
