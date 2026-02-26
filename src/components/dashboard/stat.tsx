"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  source = "",
  sourceUrl = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  source?: string;
  sourceUrl?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return (
    <div className="flex flex-col gap-1 w-fit justify-end h-full">
      <div className="flex items-baseline gap-1 whitespace-nowrap w-fit">
        {prefix && (
          <span className="text-xl font-semibold text-muted">
            {prefix}
          </span>
        )}
        <motion.span 
          className="text-4xl sm:text-[2.5rem] font-mono font-medium tracking-tight text-foreground whitespace-nowrap transition-all duration-300 leading-none"
        >
          {displayValue.toLocaleString()}
        </motion.span>
        {suffix && (
          <span className="text-lg font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1 w-max">
        <span className="text-[10px] text-muted tracking-widest uppercase">
          Source:
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted/10 text-muted hover:text-foreground text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide transition-colors cursor-pointer"
          >
            {source}
          </a>
        ) : (
          <span className="bg-muted/10 text-muted text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}

export function StaticStringStat({
  value,
  prefix = "",
  suffix = "",
  source = "",
  sourceUrl = "",
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  source?: string;
  sourceUrl?: string;
}) {
  return (
    <div className="flex flex-col gap-1 w-fit justify-end h-full">
      <div className="flex items-baseline gap-1 whitespace-nowrap w-fit">
        {prefix && (
          <span className="text-xl font-semibold text-muted">
            {prefix}
          </span>
        )}
        <span 
          className="text-4xl sm:text-[2.5rem] font-mono font-medium tracking-tight text-foreground whitespace-nowrap transition-all duration-300 leading-none"
        >
          {value}
        </span>
        {suffix && (
          <span className="text-lg font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1 w-max">
        <span className="text-[10px] text-muted tracking-widest uppercase">
          Source:
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted/10 text-muted hover:text-foreground text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide transition-colors cursor-pointer"
          >
            {source}
          </a>
        ) : (
          <span className="bg-muted/10 text-muted text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono tracking-wide">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}
