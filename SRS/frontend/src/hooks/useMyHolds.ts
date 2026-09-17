import { useCallback, useEffect, useState } from "react";

// Must match HOLD_EXPIRY_TIME_SECONDS in the backend config.
// Only used for waitlist promotions, where the event log tells us
// *when* the hold was created but not when it expires.
const HOLD_WINDOW_MS = 60 * 1000;

export interface StoredHold {
  code: string;
  seatNumber: number;
  email: string;
  expiresAt: number | null; // null = confirmed, never expires
  confirmed: boolean;
}

const STORAGE_KEY = "srs.holds";

function load(): StoredHold[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return []; // corrupted storage shouldn't crash the app
  }
}

export function useMyHolds() {
  const [holds, setHolds] = useState<StoredHold[]>(load);

  // Mirror state into localStorage on every change so a refresh
  // doesn't lose the codes (the backend can't give them back).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holds));
  }, [holds]);

  const upsert = useCallback((hold: StoredHold) => {
    setHolds((prev) => [...prev.filter((h) => h.code !== hold.code), hold]);
  }, []);

  const remove = useCallback((code: string) => {
    setHolds((prev) => prev.filter((h) => h.code !== code));
  }, []);

  return { holds, upsert, remove, HOLD_WINDOW_MS };
}

// Re-renders once a second so countdowns tick. Kept separate from the
// holds state — mixing them would rewrite localStorage every second.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}