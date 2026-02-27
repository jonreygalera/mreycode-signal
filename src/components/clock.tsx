"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock as ClockIcon, Calendar, ChevronDown, Check, Globe, Maximize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";



export function Clock() {
  const { settings, updateSettings } = useSettings();
  const timezone = settings.timezone;
  const setTimezone = (tz: string) => updateSettings({ timezone: tz });
  
  const [time, setTime] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    try {
      // @ts-ignore
      const allTimezones = Intl.supportedValuesOf("timeZone");
      setTimezones(allTimezones);
    } catch (e) {
      setTimezones(["UTC", "Asia/Manila", "America/New_York", "Europe/London", "Asia/Tokyo"]);
    }
  }, []);

  const fetchTime = useCallback(async (tz: string) => {
    try {
      const res = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${tz}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // data.dateTime is like "2026-02-26T17:53:25.0710628"
      const date = new Date(data.dateTime);
      setTime(date);
    } catch (err) {
      console.error("Failed to fetch time", err);
      // Fallback to local time with basic timezone adjustment if API fails
      // This is less accurate than the API but provides immediate UI feedback
      setTime(new Date());
    }
  }, []);

  // Sync with API once on mount or when timezone changes
  useEffect(() => {
    fetchTime(timezone);
  }, [timezone, fetchTime]);

  // Local tick every second
  useEffect(() => {
    if (!time) return;

    const interval = setInterval(() => {
      setTime((prev) => (prev ? new Date(prev.getTime() + 1000) : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center gap-4 px-3 py-1.5 animate-pulse opacity-50">
        <div className="h-3 w-20 bg-muted rounded-full" />
        <div className="h-3 w-16 bg-muted rounded-full" />
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const dateString = time.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const selectedTzLabel = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 rounded-[4px] border border-transparent transition-all hover:bg-foreground/5 hover:border-border group",
          isOpen && "bg-foreground/5 border-border shadow-sm"
        )}
      >
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-bold tracking-tight text-foreground lining-nums">
              {timeString}
            </span>
            <div className="h-2 w-px bg-border/60" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                {selectedTzLabel}
              </span>
              <ChevronDown size={10} className={cn("text-muted transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-60">
             <Calendar size={10} className="text-muted" />
             <span className="text-[9px] font-medium text-muted uppercase tracking-wider">
               {dateString}
             </span>
          </div>
        </div>
      </button>

      <button
        onClick={() => setIsMaximized(true)}
        className="p-1 hover:bg-muted/20 rounded transition-colors text-muted hover:text-foreground mr-1"
        title="Maximize Clock"
      >
        <Maximize2 size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-8 z-60 mt-1 w-48 overflow-hidden rounded-md border border-border bg-panel shadow-xl backdrop-blur-md"
          >
            <div className="px-2 py-1.5 border-b border-border bg-muted/5 flex items-center gap-2">
              <Globe size={10} className="text-muted" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Select Timezone</span>
            </div>
            <div className="p-1 max-h-[240px] overflow-y-auto">
              {timezones.map((tz) => (
                <button
                   key={tz}
                   onClick={() => {
                     setTimezone(tz);
                     setIsOpen(false);
                   }}
                   className={cn(
                     "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[11px] transition-colors",
                     timezone === tz
                       ? "bg-primary/10 text-primary font-bold" 
                       : "text-muted hover:bg-muted/20 hover:text-foreground"
                   )}
                 >
                   <span className="truncate">{tz.replace(/_/g, " ")}</span>
                   {timezone === tz && <Check size={12} className="shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-xl"
            onClick={() => setIsMaximized(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-8 p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center">
                <span className="text-[12rem] md:text-[20rem] font-mono font-black tracking-tighter text-foreground leading-none lining-nums drop-shadow-2xl">
                  {timeString}
                </span>
                <div className="flex items-center gap-6 mt-4">
                  <span className="text-4xl md:text-6xl font-black text-primary uppercase tracking-[0.2em]">
                    {selectedTzLabel}
                  </span>
                  <div className="h-12 w-1 bg-border/40" />
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                      <Calendar size={32} className="text-muted" />
                      <span className="text-3xl md:text-5xl font-bold text-muted uppercase tracking-widest italic opacity-80">
                        {dateString}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 mt-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Powered by</span>
                  <a 
                    href="https://timeapi.io" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] font-mono font-bold text-primary hover:underline"
                  >
                    TIMEAPI.IO
                  </a>
                </div>
              </div>
              
              <button
                onClick={() => setIsMaximized(false)}
                className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-all text-muted hover:text-foreground group"
              >
                <X size={48} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
