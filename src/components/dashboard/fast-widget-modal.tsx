"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Save, Hash, Terminal, BookOpen, ChevronRight, ChevronDown, Copy, Check, Search, Type } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";
import { TEMPLATES, WidgetTemplate } from "@/config/templates";

import { FLAT_CONFIG_DOCS } from "@/config/docs";

const CONFIG_DOCS = FLAT_CONFIG_DOCS;



interface FastWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig, afterId: string | null) => void;
  existingWidgets: WidgetConfig[];
  initialConfig?: { config: WidgetConfig; afterId: string | null };
}

export function FastWidgetModal({ isOpen, onClose, onSave, existingWidgets, initialConfig }: FastWidgetModalProps) {
  const [afterId, setAfterId] = useState<string | null>(initialConfig?.afterId || null);
  const [configText, setConfigText] = useState(initialConfig ? JSON.stringify(initialConfig.config, null, 2) : "");
  const [error, setError] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateLabel, setSelectedTemplateLabel] = useState<string | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if initialConfig changes (when modal opens for a different widget)
  useEffect(() => {
    if (initialConfig) {
      setAfterId(initialConfig.afterId);
      setConfigText(JSON.stringify(initialConfig.config, null, 2));
    } else {
      setAfterId(null);
      setConfigText("");
    }
  }, [initialConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    try {
      const config = JSON.parse(configText);
      
      // Basic requirements
      if (!config.id || !config.type || !config.label) {
        setError("Invalid config: id, type, and label are required.");
        return;
      }

      // Unique ID validation
      const isRecordUpdate = initialConfig && initialConfig.config.id === config.id;
      const isIdTaken = existingWidgets.some(w => w.id === config.id);

      if (isIdTaken && !isRecordUpdate) {
        setError(`The ID "${config.id}" is already taken. Please use a unique identifier.`);
        return;
      }

      onSave(config, afterId);
      setConfigText("");
      setAfterId(null);
      setError(null);
      onClose();
    } catch (e) {
      setError("Invalid JSON format.");
    }
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
            className={cn(
              "relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] transition-all duration-300 w-full",
              showDocs ? "max-w-4xl" : "max-w-2xl"
            )}
          >
            <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">
                    {initialConfig ? "Edit Widget" : "Add Widget"}
                  </h2>
                  <p className="text-xs text-muted/70">
                    {initialConfig ? "Update existing widget configuration" : "Create a new custom widget in this workspace"}
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted/70">
                  <Hash size={14} />
                  Insert After
                </label>
                <select
                  value={afterId || ""}
                  onChange={(e) => setAfterId(e.target.value || null)}
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all appearance-none cursor-pointer text-foreground"
                >
                  <option value="">(At the Beginning)</option>
                  {existingWidgets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                  <option value="end">(At the End)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted/70">
                    <Terminal size={14} />
                    Widget Config (JSON)
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(configText);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-all"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <><Check size={12} className="text-up" /> Copied</>
                    ) : (
                      <><Copy size={12} /> Copy Config</>
                    )}
                  </button>
                </div>
                {!initialConfig && (
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                       Quick Template
                    </label>
                    <div className="relative" ref={templateDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                        className={cn(
                          "w-full bg-background border border-border rounded-[4px] px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all flex items-center justify-between group",
                          isTemplatesOpen && "ring-1 ring-foreground/20 border-foreground/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-sm bg-foreground/5 text-foreground/70">
                            <Type size={12} />
                          </div>
                          <span className={cn(
                            "font-bold uppercase tracking-wider",
                            selectedTemplateLabel ? "text-foreground" : "text-muted"
                          )}>
                            {selectedTemplateLabel || "Select a base template..."}
                          </span>
                        </div>
                        <ChevronDown size={14} className={cn("text-muted transition-transform duration-300", isTemplatesOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isTemplatesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 z-50 bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col mt-1"
                          >
                            <div className="p-2 border-b border-border bg-background focus-within:bg-muted/10 transition-colors">
                              <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                  type="text"
                                  placeholder="Search widgets..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full bg-transparent border-none pl-8 pr-2 py-1.5 text-xs placeholder:text-muted/50 focus:outline-none focus:ring-0"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1.5 max-h-[260px] overflow-y-auto custom-scrollbar bg-background/50">
                              {TEMPLATES
                                .filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()) || t.config.type.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((template, i) => (
                                  <button
                                    key={`${template.config.id}-${i}`}
                                    type="button"
                                    onClick={() => {
                                      const newId = `${template.config.id}-${Date.now().toString().slice(-4)}`;
                                      setConfigText(JSON.stringify({ ...template.config, id: newId }, null, 2));
                                      setSelectedTemplateLabel(template.label);
                                      setIsTemplatesOpen(false);
                                      setError(null);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between p-3 rounded-md border transition-all group shrink-0",
                                      selectedTemplateLabel === template.label
                                        ? "bg-foreground/5 border-foreground/10 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-foreground/5 hover:border-border/10"
                                    )}
                                  >
                                    <div className="flex flex-col items-start gap-1 text-left">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tight transition-colors",
                                        selectedTemplateLabel === template.label ? "text-foreground" : "text-muted group-hover:text-foreground"
                                      )}>
                                        {template.label}
                                      </span>
                                       <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest flex items-center gap-1">
                                         <Type size={8} /> {template.config.type}
                                       </span>
                                    </div>
                                    {selectedTemplateLabel === template.label && (
                                      <div className="p-0.5 rounded-sm bg-foreground text-background">
                                        <Check size={10} />
                                      </div>
                                    )}
                                  </button>
                              ))}
                              {TEMPLATES.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()) || t.config.type.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div className="col-span-full py-8 text-center border border-dashed border-border/40 rounded-lg">
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic">No matching templates</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <textarea
                  value={configText}
                  onChange={(e) => {
                    setConfigText(e.target.value);
                    setSelectedTemplateLabel(null);
                    setError(null);
                  }}
                  placeholder='{ "id": "my-widget", "type": "stat", "label": "My Widget", ... }'
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all min-h-[300px] resize-none text-foreground leading-relaxed"
                />
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>

              <button
                onClick={() => setShowDocs(!showDocs)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                title="Toggle Configuration Dictionary"
              >
                {showDocs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Configuration Dictionary
              </button>
            </div>

            <div className="p-6 bg-muted/5 border-t border-border/50 flex items-center justify-end gap-3 mt-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-[4px] text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
              >
                <Save size={16} />
                {initialConfig ? "Update Widget" : "Add Widget"}
              </button>
            </div>
          </div>

          {showDocs && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/50 bg-background/30 flex flex-col shrink-0 max-h-[40vh] md:max-h-none">
              <div className="p-4 md:p-6 border-b border-border/50 bg-panel sticky top-0 z-10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <BookOpen size={14} />
                  Dictionary
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono">
                {CONFIG_DOCS.map((doc) => (
                  <div key={doc.key} className="space-y-1 p-2 hover:bg-foreground/5 rounded transition-colors group">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-bold text-foreground bg-foreground/10 px-1 rounded">
                        {doc.key}
                      </code>
                      {doc.required && (
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Required</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted italic leading-tight">{doc.type}</p>
                    <p className="text-[11px] text-muted/80 leading-snug group-hover:text-foreground/80 transition-colors">
                      {doc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
