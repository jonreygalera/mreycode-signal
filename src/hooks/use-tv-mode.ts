"use client";

import { useState, useEffect, useCallback } from "react";

export function useTVMode() {
  const [isTVMode, setIsTVMode] = useState(false);

  const toggleTVMode = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsTVMode(true);
      } catch (err) {
        console.error(`Error attempting to enable fullscreen: ${err}`);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsTVMode(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsTVMode(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return { isTVMode, toggleTVMode };
}
