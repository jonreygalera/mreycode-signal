"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Clock as ClockIcon, Calendar, ChevronDown, Check, Globe, Maximize2, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";

const CLOCK_REFRESH_INTERVAL = 300000; //  5 minutes

export function Clock({ timezone: propTimezone, isWidget }: { timezone?: string; isWidget?: boolean }) {
  const { settings, updateSettings } = useSettings();
  const timezone = propTimezone || settings.timezone;
  const setTimezone = (tz: string) => updateSettings({ timezone: tz });
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const [time, setTime] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMaximized = searchParams.get("widget") === "clock";
  
  const setIsMaximized = (max: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (max) params.set("widget", "clock");
    else params.delete("widget");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
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
      const date = new Date(data.dateTime);
      setTime(date);
    } catch (err) {
      console.error("Failed to fetch time", err);
      setTime(new Date());
    }
  }, []);

  useEffect(() => {
    fetchTime(timezone);

    const interval = setInterval(() => {
      fetchTime(timezone);
    }, CLOCK_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [timezone, fetchTime]);


  useEffect(() => {
    if (!time) return;
    const interval = setInterval(() => {
      setTime((prev) => (prev ? new Date(prev.getTime() + 1000) : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery(""); // Reset search when closing
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
  const dayString = time.toLocaleDateString("en-US", { weekday: "long" });

  const selectedTzLabel = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;

  const maximizedLayout = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black overflow-hidden pointer-events-auto"
      onClick={() => setIsMaximized(false)}
    >
      {/* Immersive Background Layer - Performance Optimized */}
      {settings.useBgInClock && settings.backgroundImage ? (
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
          <motion.div 
            className="w-full h-full"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 20, 
              ease: "linear", 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            style={{ willChange: "transform" }}
          >
            <img 
              src={settings.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-50 select-none pointer-events-none"
              style={{ transform: "translateZ(0)" }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/20 to-black/80 backdrop-blur-[1px]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-3xl" />
      )}

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative z-10 flex flex-col items-center gap-12 p-12 text-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-6 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm"
          >
            <span className="text-sm font-black text-primary uppercase tracking-[0.4em] lining-nums">
              {selectedTzLabel}
            </span>
          </motion.div>

          <span className={cn(
            "text-[15vw] sm:text-[16vw] md:text-[14vw] lg:text-[18vw]  font-mono font-black tracking-tighter leading-none lining-nums drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)] transition-all",
            settings.useBgInClock && settings.backgroundImage ? "text-white" : "text-foreground"
          )}>
            {timeString}
          </span>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 md:gap-4"
          >
            <Calendar size={20} className={cn("md:w-6 md:h-6", settings.useBgInClock && settings.backgroundImage ? "text-white/40" : "text-muted")} />
            <span className={cn(
              "text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[0.2em] italic",
              settings.useBgInClock && settings.backgroundImage ? "text-white/80" : "text-muted"
            )}>
              {dayString}, {dateString}
            </span>
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-6">
          <div className="h-px w-16 md:w-24 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
          <div className="flex items-center gap-3 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <span className="text-[9px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">Powered by</span>
            <a 
              href="https://timeapi.io" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] md:text-[11px] font-mono font-bold text-primary hover:text-primary/80 transition-colors"
            >
              TIMEAPI.IO
            </a>
          </div>
        </div>
        
        <button
          onClick={() => setIsMaximized(false)}
          className="fixed top-4 right-4 md:top-12 md:right-12 p-3 md:p-5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white group active:scale-95 z-50"
        >
          <X size={32} className="md:w-12 md:h-12 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </motion.div>
    </motion.div>
  );

  if (isWidget) {
    return (
      <div className="flex flex-col items-center select-none">
        <span className="font-mono text-4xl font-black tracking-tighter text-foreground lining-nums">
          {timeString}
        </span>
        <div className="flex flex-col items-center gap-0.5 mt-1">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] lining-nums">
            {selectedTzLabel}
          </span>
          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
            {dayString}, {dateString}
          </span>
        </div>
      </div>
    );
  }

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
               {dayString}, {dateString}
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
            
            <div className="p-2 border-b border-border bg-background focus-within:bg-muted/10 transition-colors">
              <div className="relative">
                <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search zone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none pl-6 pr-2 py-1 text-[11px] placeholder:text-muted/50 focus:outline-none focus:ring-0"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-1 max-h-[240px] overflow-y-auto custom-scrollbar">
              {timezones
                .filter(tz => tz.toLowerCase().includes(searchQuery.toLowerCase().replace(/ /g, "_")))
                .map((tz) => (
                <button
                   key={tz}
                   onClick={() => {
                     setTimezone(tz);
                     setIsOpen(false);
                     setSearchQuery("");
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
              {timezones.filter(tz => tz.toLowerCase().includes(searchQuery.toLowerCase().replace(/ /g, "_"))).length === 0 && (
                <div className="px-2 py-4 text-center">
                  <span className="text-[10px] text-muted italic">No matching zones found</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && isMaximized && createPortal(
        <AnimatePresence mode="wait">
          {isMaximized && maximizedLayout}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
