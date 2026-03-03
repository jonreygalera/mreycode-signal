"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, Square, CheckSquare, List, Info, Type, Database } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; widgets: WidgetConfig[] }) => Promise<void>;
  initialData: {
    workspaceName: string;
    widgets: WidgetConfig[];
  } | null;
}

export function ImportModal({ isOpen, onClose, onConfirm, initialData }: ImportModalProps) {
  const [importName, setImportName] = useState("");
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && initialData) {
      setImportName(initialData.workspaceName || "Imported Workspace");
      setSelectedWidgetIds(new Set(initialData.widgets.map(w => w.id)));
      setIsImporting(false);
      setProgress(0);
    }
  }, [isOpen, initialData]);

  if (!initialData) return null;

  const toggleAll = () => {
    if (selectedWidgetIds.size === initialData.widgets.length) {
      setSelectedWidgetIds(new Set());
    } else {
      setSelectedWidgetIds(new Set(initialData.widgets.map(w => w.id)));
    }
  };

  const toggleWidget = (id: string) => {
    const next = new Set(selectedWidgetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWidgetIds(next);
  };

  const handleImport = async () => {
    if (isImporting || selectedWidgetIds.size === 0) return;
    
    setIsImporting(true);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    const selectedWidgets = initialData.widgets.filter(w => selectedWidgetIds.has(w.id));
    
    await onConfirm({
      name: importName,
      widgets: selectedWidgets
    });

    setProgress(100);
    // Modal closure and redirection should happen in parent handleConfirmImport
  };

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
            className="relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col w-full max-w-xl max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-md text-primary">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">Import Configuration</h2>
                  <p className="text-xs text-muted/70 uppercase tracking-widest">Review and select widgets to load</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">New Workspace Name</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-foreground font-medium"
                  placeholder="Workspace name..."
                />
              </div>

              {/* Widgets List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Widgets from File ({initialData.widgets.length})</label>
                  <button 
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                  >
                    {selectedWidgetIds.size === initialData.widgets.length ? (
                      <><CheckSquare size={12} /> Deselect All</>
                    ) : (
                      <><Square size={12} /> Select All</>
                    )}
                  </button>
                </div>

                <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {initialData.widgets.map((widget, i) => (
                    <button
                      key={`${widget.id}-${i}`}
                      onClick={() => toggleWidget(widget.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-md border transition-all group",
                        selectedWidgetIds.has(widget.id)
                          ? "bg-primary/5 border-primary/10"
                          : "bg-transparent border-transparent hover:bg-foreground/5"
                      )}
                    >
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-tight transition-colors",
                          selectedWidgetIds.has(widget.id) ? "text-foreground" : "text-muted group-hover:text-foreground"
                        )}>
                          {widget.label}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-muted/40 uppercase tracking-widest flex items-center gap-1">
                             <Type size={8} /> {widget.type}
                           </span>
                        </div>
                      </div>
                      <div className={cn(
                        "p-1 rounded-sm border transition-all",
                        selectedWidgetIds.has(widget.id)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-transparent"
                      )}>
                        <Check size={12} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="p-4 bg-muted/5 border border-border/50 rounded-lg flex gap-3">
                <Info size={16} className="text-muted shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted leading-relaxed italic">
                  This will create a new workspace. Existing workspaces will not be modified.
                </p>
              </div>
            </div>

            {/* Footer / Progress */}
            <div className="p-6 bg-muted/5 border-t border-border/50">
              <AnimatePresence mode="wait">
                {isImporting ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      <span>Synchronizing Data...</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-end gap-3"
                  >
                    <button
                      onClick={onClose}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={selectedWidgetIds.size === 0 || !importName.trim()}
                      className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-[4px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                    >
                      <Upload size={14} />
                      Import Workspace
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
