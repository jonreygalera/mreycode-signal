"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Save, Hash, Terminal } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { cn } from "@/lib/utils";

interface FastWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig, afterId: string | null) => void;
  existingWidgets: WidgetConfig[];
}

export function FastWidgetModal({ isOpen, onClose, onSave, existingWidgets }: FastWidgetModalProps) {
  const [afterId, setAfterId] = useState<string | null>(null);
  const [configText, setConfigText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const config = JSON.parse(configText);
      if (!config.id || !config.type || !config.label) {
        setError("Invalid config: id, type, and label are required.");
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
            className="relative w-full max-w-2xl bg-panel border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">Fast Widget</h2>
                  <p className="text-xs text-muted/70">Create a temporary widget in local storage</p>
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
            </div>

            <div className="p-6 bg-muted/5 border-t border-border/50 flex items-center justify-end gap-3">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
