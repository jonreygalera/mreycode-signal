"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { WidgetConfig } from "@/types/widget";
import { WidgetGrid } from "./widget-grid";
import { cn } from "@/lib/utils";
import { Plus, Trash2, MonitorOff, RotateCcw } from "lucide-react";
import { FastWidgetModal } from "./fast-widget-modal";
import { HistoryModal } from "./history-modal";
import { 
  getTempWidgets, 
  saveTempWidget, 
  mergeWidgets,
  getHistoryWidgets,
  deleteTempWidget,
  restoreWidgetFromHistory,
  permadeleteFromHistory,
  restoreAllHistory,
  clearHistory,
  TempWidget
} from "@/lib/widgets";
import { Clock } from "../clock";
import { ThemeToggle } from "../theme-toggle";
import { useTVMode } from "@/context/tv-mode-context";
import { useAlert } from "@/context/alert-context";


export function DashboardView({ configs: baseConfigs }: { configs: WidgetConfig[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isTVMode, toggleTVMode } = useTVMode();
  const { showAlert } = useAlert();

  const [widgetToEdit, setWidgetToEdit] = useState<{ config: WidgetConfig; afterId: string | null } | null>(null);
  const [tempWidgets, setTempWidgets] = useState<{ config: WidgetConfig; afterId: string | null }[]>([]);
  const [historyWidgets, setHistoryWidgets] = useState<TempWidget[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    setTempWidgets(getTempWidgets());
    setHistoryWidgets(getHistoryWidgets());
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

  const handleDeleteWidget = async (id: string) => {
    const confirmed = await showAlert({
      title: "Delete Widget",
      message: "Are you sure you want to remove this widget from your dashboard? It will be moved to history.",
      type: "warning",
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Keep it"
    });

    if (confirmed) {
      deleteTempWidget(id);
      setTempWidgets(getTempWidgets());
      setHistoryWidgets(getHistoryWidgets());
    }
  };

  const handleRestoreFromHistory = (id: string) => {
    restoreWidgetFromHistory(id);
    setTempWidgets(getTempWidgets());
    setHistoryWidgets(getHistoryWidgets());
  };

  const handlePermadelete = (id: string) => {
    permadeleteFromHistory(id);
    setHistoryWidgets(getHistoryWidgets());
  };

  const handleRestoreAllHistory = () => {
    restoreAllHistory();
    setTempWidgets(getTempWidgets());
    setHistoryWidgets(getHistoryWidgets());
    setIsHistoryOpen(false);
  };

  const handleClearHistory = async () => {
    const confirmed = await showAlert({
      title: "Empty Trash",
      message: "Are you sure you want to permanently delete all widgets in history?",
      type: "error",
      showCancel: true,
      confirmText: "Empty Bin",
      cancelText: "Cancel"
    });

    if (confirmed) {
      clearHistory();
      setHistoryWidgets([]);
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showAlert({
      title: "Clear All Widgets",
      message: "This will move all custom widgets to history. This action can be undone from the recycle bin.",
      type: "warning",
      showCancel: true,
      confirmText: "Clear All",
      cancelText: "Cancel"
    });

    if (confirmed) {
      const current = getTempWidgets();
      current.forEach(w => deleteTempWidget(w.config.id));
      setTempWidgets([]);
      setHistoryWidgets(getHistoryWidgets());
    }
  };


  return (
    <div className={cn("flex flex-col gap-4 pb-32", isTVMode && "pt-6")}>
      {!isTVMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-border pb-4 gap-4"
        >
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight text-foreground uppercase">
              Metrics Overview
            </h1>
            <p className="text-sm text-muted">
              Monitor key performance indicators
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tempWidgets.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 rounded-[4px] whitespace-nowrap"
                title="Clear temporary widgets"
              >
                <Trash2 size={14} />
                Clear Temp
              </button>
            )}
            {historyWidgets.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-all border border-border/40 hover:border-border rounded-[4px] whitespace-nowrap bg-panel/30"
                title="View deleted widgets"
              >
                <div className="relative">
                  <RotateCcw size={14} className="group-hover:-rotate-45 transition-transform duration-300" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                  </span>
                </div>
                History
              </button>
            )}
            <button
              onClick={() => {
                setWidgetToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-[4px] text-xs font-semibold border border-border transition-all active:scale-95 whitespace-nowrap ml-auto sm:ml-0"
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

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={historyWidgets}
        onRestore={handleRestoreFromHistory}
        onRestoreAll={handleRestoreAllHistory}
        onDelete={handlePermadelete}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
