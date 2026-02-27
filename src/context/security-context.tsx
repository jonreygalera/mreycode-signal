"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { SECURITY_CONFIG } from "@/config/security";
import { useAlert } from "./alert-context";

interface SecurityContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);
  const sequenceRef = useRef<string>("");
  const { showAlert } = useAlert();

  const toggleDevMode = () => {
    setIsDevMode((prev) => {
      const newState = !prev;
      showAlert({
        title: newState ? "Developer Mode Enabled" : "Security Lock Active",
        message: newState 
          ? "Browser restrictions lifted. You can now use DevTools." 
          : "Context menu and keyboard shortcuts are now restricted.",
        type: newState ? "success" : "info",
      });
      return newState;
    });
  };

  useEffect(() => {
    if (!SECURITY_CONFIG.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Sequence Logic (Alt + sequence)
      // Must hold Alt while typing the sequence
      if (e.altKey) {
        // Ignore the Alt key itself when it's first pressed
        if (e.key !== "Alt") {
          const char = e.key.toLowerCase();
          sequenceRef.current += char;
          
          if (sequenceRef.current === SECURITY_CONFIG.secretSequence.toLowerCase()) {
            toggleDevMode();
            sequenceRef.current = "";
            e.preventDefault();
            return;
          }
          
          // Reset if current sequence doesn't match start of secret
          if (!SECURITY_CONFIG.secretSequence.toLowerCase().startsWith(sequenceRef.current)) {
            sequenceRef.current = "";
          }
        }
      } else {
        sequenceRef.current = "";
      }

      // If NOT in Dev Mode, block common shortcuts
      if (!isDevMode) {
        const key = e.key.toUpperCase();
        const ctrlShift = e.ctrlKey && e.shiftKey;

        // F12 or Ctrl+Shift+I/J/C
        if (key === "F12" || (ctrlShift && ["I", "J", "C"].includes(key))) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+U (View Source), Ctrl+S (Save), Ctrl+P (Print)
        if (e.ctrlKey && ["U", "S", "P"].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Shift+F10 (Alternative Context Menu)
        if (e.shiftKey && key === "F10") {
          e.preventDefault();
          return false;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!isDevMode) {
        e.preventDefault();
        return false;
      }
    };

    const handleBlur = () => {
      sequenceRef.current = "";
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isDevMode]);

  return (
    <SecurityContext.Provider value={{ isDevMode, toggleDevMode }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
