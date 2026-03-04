"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { X, Save, FolderPlus, Edit2, Copy, Check, Square, CheckSquare, Type, Info, Search, GripVertical } from "lucide-react";
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
  initialSelectedWidgets?: WidgetConfig[];
}

export function WorkspaceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  initialValue = "", 
  placeholder = "Enter workspace name...",
  mode,
  availableWidgets = [],
  initialSelectedWidgets = []
}: WorkspaceModalProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  // Use an array to maintain selection order
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Use a ref to track if we've already initialized for the current "open" session
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setName(initialValue);
      setError(null);
      setIsProcessing(false);
      setProgress(0);
      setSearchTerm("");
      
      if (mode === 'copy') {
        setSelectedWidgets([...availableWidgets]);
      } else if (mode === 'rename') {
        setSelectedWidgets([...initialSelectedWidgets]);
      } else {
        setSelectedWidgets([]);
      }
      setHasInitialized(true);
    } else if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, initialValue, mode, availableWidgets, initialSelectedWidgets]);

  const toggleAll = () => {
    if (selectedWidgets.length === availableWidgets.length) {
      setSelectedWidgets([]);
    } else {
      setSelectedWidgets([...availableWidgets]);
    }
  };

  const toggleWidget = (widget: WidgetConfig) => {
    const exists = selectedWidgets.some(w => w.id === widget.id);
    if (exists) {
      setSelectedWidgets(selectedWidgets.filter(w => w.id !== widget.id));
    } else {
      setSelectedWidgets([...selectedWidgets, widget]);
    }
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

  const showWidgetSelection = mode === 'add' || mode === 'copy' || mode === 'rename';

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
              showWidgetSelection ? "max-w-4xl max-h-[95vh] md:max-h-[90vh]" : "max-w-md"
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
                      Configure your environment layout
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

            {/* Content Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              <div className={cn(
                "flex-1 overflow-y-auto p-6 space-y-6",
                showWidgetSelection && "md:border-r md:border-border/50"
              )}>
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
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Widget Templates</label>
                      <button 
                        onClick={toggleAll}
                        type="button"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                      >
                        {selectedWidgets.length === availableWidgets.length ? (
                          <><CheckSquare size={12} /> Deselect All</>
                        ) : (
                          <><Square size={12} /> Select All</>
                        )}
                      </button>
                    </div>

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {availableWidgets
                        .filter(w => w.label.toLowerCase().includes(searchTerm.toLowerCase()) || w.type.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((widget, i) => {
                          const selectedIndex = selectedWidgets.findIndex(w => w.id === widget.id);
                          const isSelected = selectedIndex !== -1;
                          
                          return (
                            <button
                              key={`${widget.id}-${i}`}
                              type="button"
                              onClick={() => toggleWidget(widget)}
                              className={cn(
                                "relative w-full flex items-center justify-between p-3 rounded-md border group shrink-0",
                                isSelected
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-transparent border-transparent hover:bg-foreground/5 h-full"
                              )}
                            >
                              <div className="flex flex-col items-start gap-0.5 text-left">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-tight transition-colors",
                                  isSelected ? "text-foreground" : "text-muted group-hover:text-foreground"
                                )}>
                                  {widget.label}
                                </span>
                                <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest flex items-center gap-1">
                                  <Type size={8} /> {widget.type}
                                </span>
                              </div>
                              {isSelected ? (
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                                  {selectedIndex + 1}
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border border-border bg-background flex items-center justify-center text-transparent">
                                  <Check size={10} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Reorder Side Panel */}
              {showWidgetSelection && (
                <div className="w-full md:w-[320px] bg-muted/5 flex flex-col min-h-0">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between bg-panel/50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      Active Rendering Order ({selectedWidgets.length})
                    </span>
                    {selectedWidgets.length > 0 && (
                      <button 
                         onClick={() => setSelectedWidgets([])}
                         className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {selectedWidgets.length > 0 ? (
                      <Reorder.Group 
                        axis="y" 
                        values={selectedWidgets} 
                        onReorder={setSelectedWidgets}
                        className="space-y-2"
                      >
                        {selectedWidgets.map((widget) => (
                          <Reorder.Item 
                            key={widget.id} 
                            value={widget}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="relative flex items-center gap-3 p-3 bg-panel border border-border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:border-foreground/20 group z-10"
                          >
                            <GripVertical size={14} className="text-muted group-hover:text-foreground/50 transition-colors shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-tight text-foreground truncate">
                                {widget.label}
                              </span>
                              <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">
                                {widget.type}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWidget(widget);
                              }}
                              className="ml-auto p-1 text-muted hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border rounded-xl px-4 py-12">
                         <div className="p-3 bg-foreground/5 rounded-full mb-3">
                           <FolderPlus size={24} className="text-muted" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                           Select widgets to define the initial layout
                         </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-border/50 bg-panel/30">
                    <div className="flex gap-3">
                      <Info size={14} className="text-muted shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted leading-relaxed italic">
                        Drag to reorder. The top-most widget will render first in your new workspace.
                      </p>
                    </div>
                  </div>
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
