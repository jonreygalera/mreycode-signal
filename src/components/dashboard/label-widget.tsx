"use client";

import { useMemo } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { LabelConfig } from "@/types/widget";

interface LabelWidgetProps {
  label: string;
  config?: LabelConfig['config'];
  data?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function LabelWidget({ label, config, data, size = "sm" }: LabelWidgetProps) {
  const Icon = useMemo(() => {
    if (!config?.icon) return null;
    const IconComponent = (Icons as any)[config.icon];
    return IconComponent ? <IconComponent size={config.variant === 'hero' ? 24 : 16} /> : null;
  }, [config?.icon, size]);

  const displayText = data || label;
  const subtitle = config?.subtitle;
  const align = config?.align || 'left';
  const variant = config?.variant || 'simple';

  const containerClasses = cn(
    "flex flex-col h-full w-full transition-all duration-300",
    align === 'center' ? "items-center justify-center text-center" : 
    align === 'right' ? "items-end justify-center text-right" : "items-start justify-center text-left",
    variant === 'pill' && "bg-foreground/5 rounded-full px-4 py-1 self-center",
    variant === 'hero' && "py-4"
  );

  const labelClasses = cn(
    "font-bold tracking-tight transition-colors flex items-center gap-2",
    variant === 'simple' && "text-sm text-foreground",
    variant === 'pill' && "text-[10px] uppercase tracking-[0.2em] text-primary whitespace-nowrap",
    variant === 'hero' && "text-2xl sm:text-3xl md:text-4xl text-foreground"
  );

  const subtitleClasses = cn(
    "text-muted/60 font-medium",
    variant === 'hero' ? "text-sm mt-1" : "text-[10px] mt-0.5"
  );

  const content = (
    <div className={containerClasses}>
      <div className={labelClasses}>
        {Icon}
        <span>{displayText}</span>
      </div>
      {subtitle && <span className={subtitleClasses}>{subtitle}</span>}
    </div>
  );

  if (config?.link) {
    return (
      <a 
        href={config.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full h-full hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}
