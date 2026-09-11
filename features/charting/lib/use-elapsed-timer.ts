"use client";

import { useEffect, useState } from "react";
import type { ListenStatus } from "@/features/charting/lib/corti/types";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** mm:ss elapsed since a listening session started. Keeps counting through "paused" pauses (frozen, not reset) and resets to 00:00 once status returns to idle. */
export function useElapsedTimer(status: ListenStatus): string {
  const [seconds, setSeconds] = useState(0);
  const [prevStatus, setPrevStatus] = useState(status);

  // Reset synchronously during render on the idle transition — React's
  // recommended way to adjust state in response to a changed prop, instead
  // of doing it inside an effect body (which would cause an extra render).
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "idle") setSeconds(0);
  }

  useEffect(() => {
    if (status !== "listening") return;
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  return formatElapsed(seconds);
}
