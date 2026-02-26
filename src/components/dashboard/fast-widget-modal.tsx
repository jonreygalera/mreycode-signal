"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Save, Hash, Terminal, BookOpen, ChevronRight, ChevronDown } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";

const CONFIG_DOCS = [
  { key: "id", type: "string", description: "Unique identifier for the widget", required: true },
  { key: "label", type: "string", description: "Display title shown on the card", required: true },
  { key: "type", type: "'stat' | 'line' | 'bar' | 'area'", description: "Widget visualization style", required: true },
  { key: "api", type: "string", description: "The URL endpoint to fetch data from", required: true },
  { key: "responsePath", type: "string", description: "Dot-notation path to data (e.g., 'result.count')", required: true },
  { key: "size", type: "'sm' | 'md' | 'lg' | 'xl'", description: "Horizontal width/grid span" },
  { key: "refreshInterval", type: "number", description: "Auto-refresh time in milliseconds" },
  { key: "prefix / suffix", type: "string", description: "Currency or units ($, °C, %)" },
  { key: "abbreviate", type: "boolean", description: "Shorten large numbers (1M, 5K)" },
  { key: "color", type: "string", description: "'up', 'down', 'warning', 'info', 'muted'" },
  { key: "colorRules", type: "object", description: "Dynamic color based on value thresholds" },
];

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
              "relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-row max-h-[90vh] transition-all duration-300",
              showDocs ? "max-w-4xl" : "max-w-2xl w-full"
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
                    {initialConfig ? "Edit Widget" : "Fast Widget"}
                  </h2>
                  <p className="text-xs text-muted/70">
                    {initialConfig ? "Update existing widget configuration" : "Create a temporary widget in local storage"}
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
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted/70">
                  <Terminal size={14} />
                  Widget Config (JSON)
                </label>
                <textarea
                  value={configText}
                  onChange={(e) => {
                    setConfigText(e.target.value);
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
                Deploy Widget
              </button>
            </div>
          </div>

          {showDocs && (
            <div className="w-80 border-l border-border/50 bg-background/30 flex flex-col shrink-0">
              <div className="p-6 border-b border-border/50 bg-panel">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <BookOpen size={14} />
                  Dictionary
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <p className="text-[10px] text-muted italic font-mono leading-tight">{doc.type}</p>
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
