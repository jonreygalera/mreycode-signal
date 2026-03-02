"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, FolderPlus, Edit2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title: string;
  initialValue?: string;
  placeholder?: string;
  mode: 'add' | 'rename' | 'copy';
}

export function WorkspaceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  initialValue = "", 
  placeholder = "Enter workspace name...",
  mode
}: WorkspaceModalProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialValue);
      setError(null);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("Workspace name cannot be empty.");
      return;
    }

    onConfirm(trimmedName);
    onClose();
  };

  const getIcon = () => {
    switch (mode) {
      case 'rename': return <Edit2 size={20} />;
      case 'copy': return <Copy size={20} />;
      default: return <FolderPlus size={20} />;
    }
  };

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
            className="relative bg-panel border border-border rounded-lg shadow-2xl overflow-hidden w-full max-w-md flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-md text-foreground">
                  {getIcon()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight uppercase">
                    {title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted/70">
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
                  className="w-full bg-background border border-border rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-foreground"
                />
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-[4px] text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
                >
                  <Save size={16} />
                  {mode === 'add' ? 'Create' : mode === 'rename' ? 'Update' : 'Duplicate'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
