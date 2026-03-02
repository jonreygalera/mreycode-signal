"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, RefreshCw, RotateCcw, AlertTriangle } from "lucide-react";
import type { TempWidget } from "@/lib/widgets";
import { cn } from "@/lib/utils";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TempWidget[];
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  history,
  onRestore,
  onRestoreAll,
  onDelete,
  onClearAll,
}: HistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col w-full max-w-lg max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight uppercase">
                    Widget History
                    {history.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-foreground text-background text-[10px] font-black">
                        {history.length}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted/70">
                    Recently deleted temporary widgets
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/10 mb-4">
                    <Trash2 size={32} className="text-muted/40" />
                  </div>
                  <p className="text-sm font-medium text-muted">History is empty</p>
                  <p className="text-xs text-muted/60 mt-1">Deleted widgets will appear here</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.config.id}
                    className="group flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/5 hover:border-border transition-all"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground uppercase tracking-tight">
                        {item.config.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted/70 truncate">
                        ID: {item.config.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onRestore(item.config.id)}
                        className="p-1.5 hover:bg-green-500/10 rounded transition-colors text-muted hover:text-green-500"
                        title="Restore to dashboard"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item.config.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted hover:text-red-500"
                        title="Delete permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 bg-muted/5 border-t border-border/50 flex items-center justify-between gap-3">
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  <AlertTriangle size={14} />
                  Empty Bin
                </button>
                <button
                  onClick={onRestoreAll}
                  className="flex items-center gap-2 bg-foreground text-background px-4 py-1.5 rounded-[4px] text-xs font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
                >
                  <RotateCcw size={14} />
                  Restore All
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
