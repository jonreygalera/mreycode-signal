"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          drag
          dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 20 }}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-28 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-sm cursor-grab active:cursor-grabbing",
            "bg-panel border border-border text-foreground shadow-2xl backdrop-blur-md",
            "transition-colors hover:border-muted hover:bg-muted/5",
            "focus:outline-none focus:ring-1 focus:ring-foreground/20"
          )}
          aria-label="Back to top"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
          <motion.div 
            className="absolute -inset-1 bg-foreground/5 opacity-0 hover:opacity-100 rounded-lg blur transition-opacity"
            layoutId="back-to-top-glow"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
