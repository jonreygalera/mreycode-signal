"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string | number;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5",
              "bg-panel border border-border text-foreground text-xs font-mono",
              "rounded-[4px] shadow-xl whitespace-nowrap z-50 pointer-events-none",
              className
            )}
          >
            {content}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-panel" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-b-border -translate-y-px -z-10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
