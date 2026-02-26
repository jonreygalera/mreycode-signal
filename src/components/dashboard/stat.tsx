"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
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
      {/* Mock change indicator for the aesthetic */}
      <div className="flex items-center gap-1 mt-1 w-max">
        <span className="text-up bg-up/10 text-[10px] px-1.5 py-0.5 rounded-[2px] font-semibold tracking-wide">
          +{(Math.random() * 5 + 1).toFixed(2)}%
        </span>
        <span className="text-[10px] text-muted tracking-wide uppercase">
          Since last interval
        </span>
      </div>
    </div>
  );
}
