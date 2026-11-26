"use client";

import { useEffect, useState } from "react";
import { todayLocal } from "@/lib/dates";

/**
 * The viewer's current local day. Re-checked every minute and when the tab becomes visible, so a
 * card whose deadline was "today" turns overdue when the day changes, with no reload (CA-P4).
 */
export function useToday(): string {
  const [today, setToday] = useState(() => todayLocal());

  useEffect(() => {
    const refresh = () => setToday((previous) => {
      const current = todayLocal();
      return current === previous ? previous : current;
    });
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}
