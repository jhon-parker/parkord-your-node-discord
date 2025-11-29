import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useUserStatus = (userId: string | null) => {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);

  const updateStatus = useCallback(async (status: string) => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ status, last_seen: new Date().toISOString() })
      .eq("id", userId);
  }, [userId]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (isIdleRef.current) {
      isIdleRef.current = false;
      updateStatus("online");
    }
    
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      updateStatus("idle");
    }, IDLE_TIMEOUT);
  }, [updateStatus]);

  useEffect(() => {
    if (!userId) return;

    // Set online on mount
    updateStatus("online");
    resetIdleTimer();

    // Activity listeners
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus("idle");
      } else {
        updateStatus("online");
        resetIdleTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Offline on close
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        JSON.stringify({ status: "offline", last_seen: new Date().toISOString() })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      updateStatus("offline");
    };
  }, [userId, updateStatus, resetIdleTimer]);
};
