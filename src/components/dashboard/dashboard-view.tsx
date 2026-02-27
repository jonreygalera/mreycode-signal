"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { cn } from "@/lib/utils";
import { Plus, Trash2, MonitorOff } from "lucide-react";
import { FastWidgetModal } from "./fast-widget-modal";
import { getTempWidgets, saveTempWidget, clearTempWidgets, mergeWidgets } from "@/lib/widgets";
import { Clock } from "../clock";
import { ThemeToggle } from "../theme-toggle";
import { useTVMode } from "@/context/tv-mode-context";

export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isTVMode, toggleTVMode } = useTVMode();
  const [widgetToEdit, setWidgetToEdit] = useState<{ config: WidgetConfig; afterId: string | null } | null>(null);
  const [tempWidgets, setTempWidgets] = useState<{ config: WidgetConfig; afterId: string | null }[]>([]);

  useEffect(() => {
    setTempWidgets(getTempWidgets());
  }, []);

  const allWidgets = useMemo(() => {
    return mergeWidgets(baseConfigs, tempWidgets);
  }, [baseConfigs, tempWidgets]);

  const handleSaveWidget = (config: WidgetConfig, afterId: string | null) => {
    saveTempWidget(config, afterId);
    setTempWidgets(getTempWidgets());
    setWidgetToEdit(null);
  };

  const handleEditWidget = (id: string) => {
    const widget = tempWidgets.find(w => w.config.id === id);
    if (widget) {
      setWidgetToEdit(widget);
      setIsModalOpen(true);
    }
  };

  const handleDeleteWidget = (id: string) => {
    if (confirm("Delete this widget?")) {
      const current = getTempWidgets();
      const updated = current.filter(w => w.config.id !== id);
      localStorage.setItem("mreycode_signal_temp_widgets", JSON.stringify(updated));
      setTempWidgets(updated);
    }
  };

  const handleClearAll = () => {
    if (confirm("Clear all temporary widgets?")) {
      clearTempWidgets();
      setTempWidgets([]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 pb-32", isTVMode && "pt-6")}>
      {!isTVMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-row items-end justify-between border-b border-border pb-4"
        >
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
              Metrics Overview
            </h1>
            <p className="text-sm text-muted">
              Monitor key performance indicators
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tempWidgets.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-[4px]"
                title="Clear temporary widgets"
              >
                <Trash2 size={14} />
                Clear Temp
              </button>
            )}
            <button
              onClick={() => {
                setWidgetToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95"
            >
              <Plus size={14} />
              Fast Widget
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-between mb-4">
           <button
             onClick={toggleTVMode}
             className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors border border-border/40 rounded-[2px] bg-panel/50 backdrop-blur-sm"
             title="Exit TV Mode (Esc)"
           >
             <MonitorOff size={12} />
             Exit TV Mode
           </button>
           <div className="flex items-center gap-4">
             <ThemeToggle />
             <Clock />
           </div>
        </div>
      )}
      
      <WidgetGrid 
        configs={allWidgets} 
        onEdit={handleEditWidget}
        onDelete={handleDeleteWidget}
      />

      <FastWidgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setWidgetToEdit(null);
        }}
        onSave={handleSaveWidget}
        existingWidgets={allWidgets}
        initialConfig={widgetToEdit || undefined}
      />
    </div>
  );
}
