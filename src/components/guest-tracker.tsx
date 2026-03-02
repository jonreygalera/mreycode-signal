"use client";

import { appConfig } from "@/config/app";
import { useEffect } from "react";

export default function GuestTracker() {
  useEffect(() => {
    const checkGuestStatus = async () => {
      // Check if guest has already been created in this browser
      const guestCreated = localStorage.getItem(`${appConfig.name}_guest_created`);

      if (!guestCreated) {
        try {
          const response = await fetch(`${appConfig.statsApi}/api/guest/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mrey-tenant": window.location.hostname
            },
            // Since the user didn't specify a body, we'll send an empty object if needed, 
            // but the URL alone might be enough for the backend to record the visit.
            body: JSON.stringify({}),
          });

          if (response.ok) {
            localStorage.setItem(`${appConfig.name}_guest_created`, "true");
            console.log("Guest entry created successfully.");
          }
        } catch (error) {
          console.error("Failed to create guest entry:", error);
        }
      }
    };

    checkGuestStatus();
  }, []);

  return null;
}
