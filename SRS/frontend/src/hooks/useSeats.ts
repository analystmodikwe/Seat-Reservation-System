import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import { Seat } from "../api/types";

const POLL_INTERVAL_MS = 2000;

// Polls GET /seats on an interval so the seat map reflects holds
// expiring or being released without the user reloading — the spec
// explicitly allows polling instead of requiring websockets.
export function useSeats() {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSeats = useCallback(async () => {
        try {
            const result = await api.getSeats();
            setSeats(result);
            setError(null);
        } catch {
            setError("Could not load seats.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSeats();
        const interval = setInterval(fetchSeats, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchSeats]);

    return { seats, error, loading, refetch: fetchSeats };
}