import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Seat } from "../api/types";

export function useSeats(pollMs = 2000) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback so the identity is stable and the effect below
  // doesn't re-subscribe on every render.
  const refresh = useCallback(async () => {
    try {
      setSeats(await api.getSeats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load seats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(); // fetch immediately, don't wait a full interval
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id); // cleanup stops the timer on unmount
  }, [refresh, pollMs]);

  // `refresh` is exposed so actions can force an update instead of
  // waiting for the next poll — makes clicks feel instant.
  return { seats, loading, error, refresh };
}