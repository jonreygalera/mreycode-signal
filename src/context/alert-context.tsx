"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<(AlertOptions & { resolve: (value: boolean) => void }) | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      setAlert({ ...options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (alert) {
      alert.resolve(value);
      setAlert(null);
    }
  };

  const getIcon = (type: AlertType = "info") => {
    switch (type) {
      case "success": return <CheckCircle2 className="text-green-500" size={24} />;
      case "error": return <XCircle className="text-red-500" size={24} />;
      case "warning": return <AlertCircle className="text-orange-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AnimatePresence>
        {alert && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <motion.div

              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden bg-panel border border-border rounded-xl shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {alert.title && (
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {alert.title}
                      </h3>
                    )}
                    <p className="text-sm text-muted leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleClose(false)}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                  {alert.showCancel && (
                    <button
                      onClick={() => handleClose(false)}
                      className="px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 rounded-lg transition-colors border border-border"
                    >
                      {alert.cancelText || "Cancel"}
                    </button>
                  )}
                  <button
                    onClick={() => handleClose(true)}
                    className={cn(
                      "px-6 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-black/20",
                      alert.type === "error" ? "bg-red-500 hover:bg-red-600 text-white" : 
                      alert.type === "success" ? "bg-green-500 hover:bg-green-600 text-white" :
                      "bg-foreground text-background hover:opacity-90"
                    )}
                  >
                    {alert.confirmText || "Confirm"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};
