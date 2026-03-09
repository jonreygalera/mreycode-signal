import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getNestedProperty } from "@/lib/utils";
import { getStatusColor } from "@/lib/color";
import { WidgetConfig } from "@/types/widget";

interface PulseWidgetProps {
  data: any;
  config?: {
    pulseSpeed?: 'slow' | 'normal' | 'fast';
    scorePath?: string;
    statusPath?: string;
    insightPath?: string;
    valueLabel?: string;
  };
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: WidgetConfig['color'];
  colorRules?: WidgetConfig['colorRules'];
}

export const PulseWidget = memo(function PulseWidget({ 
  data, 
  config, 
  accentColor, 
  size = 'md',
  color,
  colorRules
}: PulseWidgetProps) {
  // Extract values using standard keys or raw data with fallbacks
  const score = useMemo(() => {
    if (data === undefined || data === null) return 0;
    if (typeof data === 'number') return data;
    const val = data.score ?? data.value ?? data;
    return typeof val === 'number' ? val : (isNaN(Number(val)) ? 0 : Number(val));
  }, [data]);

  const insight = useMemo(() => {
    if (!data || typeof data !== 'object') return null;
    const val = data.insight;
    return typeof val === 'string' ? val : null;
  }, [data]);

  // Determine Semantic Color from Rules OR Static Color
  const resolvedSemanticColor = useMemo(() => {
    return getStatusColor(score, { color, colorRules } as any);
  }, [score, color, colorRules]);
  
  // Use resolved color if available, otherwise fallback to API status or 'info'
  const semanticColor = resolvedSemanticColor || 'info';

  const themeMapping: Record<string, { classes: string; hex: string; label: string }> = {
    up: { classes: "text-emerald-500 bg-emerald-500", hex: "#10b981", label: "Optimal" },
    optimal: { classes: "text-emerald-500 bg-emerald-500", hex: "#10b981", label: "Optimal" },
    stable: { classes: "text-blue-500 bg-blue-500", hex: "#3b82f6", label: "Stable" },
    info: { classes: "text-blue-500 bg-blue-500", hex: "#3b82f6", label: "Stable" },
    warning: { classes: "text-amber-500 bg-amber-500", hex: "#f59e0b", label: "Warning" },
    down: { classes: "text-rose-500 bg-rose-500", hex: "#f43f5e", label: "Critical" },
    muted: { classes: "text-slate-500 bg-slate-500", hex: "#64748b", label: "Muted" },
    foreground: { classes: "text-slate-400 bg-slate-400", hex: "#94a3b8", label: "Idle" },
  };

  const currentTheme = themeMapping[semanticColor] || themeMapping.info;
  const colorArray = currentTheme.classes.split(' ');
  
  // Color Precedence:
  // 1. If we have a resolved semantic color (from rules or base color), use it.
  // 2. Otherwise use the accentColor if provided.
  // 3. Finally fallback to the default theme hex.
  const baseColor = resolvedSemanticColor 
    ? themeMapping[resolvedSemanticColor]?.hex 
    : (accentColor || currentTheme.hex);

  const pulseDurations = {
    slow: 2.5,
    normal: 1.5,
    fast: 0.8
  };

  const duration = pulseDurations[config?.pulseSpeed || 'normal'];

  return (
    <div className="relative flex flex-col items-center justify-center p-4 w-full h-full overflow-hidden">
      {/* Ambient Background Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${baseColor}20 0%, transparent 80%)` 
        }}
      />
      <motion.div 
        layout
        className="relative flex items-center justify-center will-change-transform mb-4"
      >
        {/* Outer Glows - Reduced blur for performance */}
        <motion.div
          key={`glow-${duration}`}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.15, 0.3],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ 
            background: `radial-gradient(circle, ${baseColor}40 0%, transparent 70%)`,
            willChange: "transform, opacity"
          }}
        />
        
        {/* Pulse Ring - Hardware accelerated */}
        <motion.div
          key={`ring-${duration}`}
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute w-20 h-20 rounded-full border-2 pointer-events-none"
          style={{ 
            borderColor: baseColor,
            willChange: "transform, opacity"
          }}
        />

        {/* Core Orb */}
        <motion.div
          key={`orb-${duration}`}
          animate={{
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: duration / 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center bg-panel border-4 shadow-2xl z-10"
          style={{ 
            borderColor: baseColor,
            willChange: "transform"
          }}
        >
          <span className="text-3xl font-black tracking-tighter" style={{ color: baseColor }}>
            {score}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            {config?.valueLabel ?? ""}
          </span>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {insight && (
          <motion.div 
            key="insight"
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="text-center max-w-[280px] select-none overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className={cn("inline-block w-2 h-2 rounded-full animate-pulse", colorArray[1])} />
              <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-80", colorArray[0])}>
                {currentTheme.label} Signal
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-tight italic line-clamp-2 px-2">
              "{insight}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
