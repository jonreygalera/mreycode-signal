import { appConfig } from "@/config/app";

/**
 * Utility to calculate current LocalStorage usage
 * Most browsers have a 5MB limit per origin
 */
export const getStorageUsage = () => {
  if (typeof window === "undefined") return { usedMB: 0, limitMB: appConfig.localStorageLimit, percentage: 0 };
  
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // LocalStorage keys and values are stored as UTF-16 strings (2 bytes per char)
        totalBytes += (key.length + value.length) * 2;
      }
    }
  }
  
  const usedMB = totalBytes / (1024 * 1024);
  const limitMB = appConfig.localStorageLimit; // Standard LocalStorage limit
  const percentage = Math.min((usedMB / limitMB) * 100, 100);
  
  return {
    usedMB: parseFloat(usedMB.toFixed(2)),
    limitMB,
    percentage: parseFloat(percentage.toFixed(1))
  };
};
