"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, FolderPlus, Edit2, Copy, Check, Square, CheckSquare, Type, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig } from "@/types/widget";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, selectedWidgets: WidgetConfig[]) => Promise<void>;
  title: string;
  initialValue?: string;
  placeholder?: string;
  mode: 'add' | 'rename' | 'copy';
  availableWidgets?: WidgetConfig[];
}

export function WorkspaceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  initialValue = "", 
  placeholder = "Enter workspace name...",
  mode,
  availableWidgets = []
}: WorkspaceModalProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setName(initialValue);
      setError(null);
      setIsProcessing(false);
      setProgress(0);
      setSearchTerm("");
      // Default: select no widgets for 'add', select all for 'copy'
      if (mode === 'copy') {
        setSelectedWidgetIds(new Set(availableWidgets.map(w => w.id)));
      } else {
        setSelectedWidgetIds(new Set());
      }
    }
  }, [isOpen, initialValue, mode, availableWidgets]);

  const toggleAll = () => {
    if (selectedWidgetIds.size === availableWidgets.length) {
      setSelectedWidgetIds(new Set());
    } else {
      setSelectedWidgetIds(new Set(availableWidgets.map(w => w.id)));
    }
  };

  const toggleWidget = (id: string) => {
    const next = new Set(selectedWidgetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWidgetIds(next);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("Workspace name cannot be empty.");
      return;
    }

    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Simulate initial progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 80) {
          clearInterval(interval);
          return 80;
        }
        return prev + 5;
      });
    }, 50);

    const selectedWidgets = availableWidgets.filter(w => selectedWidgetIds.has(w.id));
    
    try {
      await onConfirm(trimmedName, selectedWidgets);
      setProgress(100);
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsProcessing(false);
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'rename': return <Edit2 size={20} />;
      case 'copy': return <Copy size={20} />;
      default: return <FolderPlus size={20} />;
    }
  };

  const showWidgetSelection = mode === 'add' || mode === 'copy';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
            className={cn(
              "relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col w-full transition-all",
              showWidgetSelection ? "max-w-xl max-h-[90vh]" : "max-w-md"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  {getIcon()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">
                    {title}
                  </h2>
                  {showWidgetSelection && (
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                      Configure your new environment
                    </p>
                  )}
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Workspace Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder={placeholder}
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-foreground font-medium"
                />
                {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">{error}</p>}
              </div>

              {showWidgetSelection && availableWidgets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Initialize With Widgets</label>
                    <button 
                      onClick={toggleAll}
                      type="button"
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedWidgetIds.size === availableWidgets.length ? (
                        <><CheckSquare size={12} /> Deselect All</>
                      ) : (
                        <><Square size={12} /> Select All</>
                      )}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-background border border-border rounded-[4px] pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
                    {availableWidgets
                      .filter(w => w.label.toLowerCase().includes(searchTerm.toLowerCase()) || w.type.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((widget, i) => (
                      <button
                        key={`${widget.id}-${i}`}
                        type="button"
                        onClick={() => toggleWidget(widget.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-md border transition-all group shrink-0",
                          selectedWidgetIds.has(widget.id)
                            ? "bg-foreground/5 border-foreground/10"
                            : "bg-transparent border-transparent hover:bg-foreground/5"
                        )}
                      >
                        <div className="flex flex-col items-start gap-0.5 text-left">
                          <span className={cn(
                            "text-[11px] font-bold uppercase tracking-tight transition-colors",
                            selectedWidgetIds.has(widget.id) ? "text-foreground" : "text-muted group-hover:text-foreground"
                          )}>
                            {widget.label}
                          </span>
                           <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest flex items-center gap-1">
                             <Type size={8} /> {widget.type}
                           </span>
                        </div>
                        <div className={cn(
                          "p-0.5 rounded-sm border transition-all",
                          selectedWidgetIds.has(widget.id)
                            ? "bg-foreground border-foreground text-background"
                            : "bg-background border-border text-transparent"
                        )}>
                          <Check size={10} />
                        </div>
                      </button>
                    ))}
                    {availableWidgets.filter(w => w.label.toLowerCase().includes(searchTerm.toLowerCase()) || w.type.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="py-8 text-center border border-dashed border-border rounded-lg">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic">No templates found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showWidgetSelection && (
                <div className="p-4 bg-muted/5 border border-border/50 rounded-lg flex gap-3">
                  <Info size={16} className="text-muted shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted leading-relaxed italic">
                    {mode === 'copy' 
                      ? "This will create a duplicate of the current workspace with selected widgets."
                      : "A fresh workspace will be created with the selected widget templates."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Progress Bar */}
            <div className="p-6 bg-muted/5 border-t border-border/50">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      <span>{mode === 'add' ? 'Building Workspace...' : mode === 'rename' ? 'Updating...' : 'Duplicating...'}</span>
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
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-2 bg-foreground text-background px-8 py-2.5 rounded-[4px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-foreground/90 transition-all active:scale-[0.98] shadow-lg shadow-foreground/10"
                    >
                      <Save size={14} />
                      {mode === 'add' ? 'Create' : mode === 'rename' ? 'Update' : 'Duplicate'}
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
