"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useIdleTimeout(timeoutSeconds = 3600) {
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, timeoutSeconds * 1000);
    };

    // Set initial timer
    resetTimer();

    // Event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [logout, isAuthenticated, timeoutSeconds]);
}
