"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { Plus, Trash2 } from "lucide-react";
import { FastWidgetModal } from "./fast-widget-modal";
import { getTempWidgets, saveTempWidget, clearTempWidgets, mergeWidgets } from "@/lib/widgets";

export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  };

  const handleClearAll = () => {
    if (confirm("Clear all temporary widgets?")) {
      clearTempWidgets();
      setTempWidgets([]);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-32">
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95"
          >
            <Plus size={14} />
            Fast Widget
          </button>
        </div>
      </motion.div>
      
      <WidgetGrid configs={allWidgets} />

      <FastWidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWidget}
        existingWidgets={allWidgets}
      />
    </div>
  );
}
