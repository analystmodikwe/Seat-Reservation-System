import { useState, useCallback } from "react";
import { api, ApiRequestError } from "../api/client";
import type { HoldResponse } from "../api/types";

// Wraps the four hold actions (place/extend/confirm/release) with
// shared loading/error state, so components don't repeat try/catch
// boilerplate around every api call.
export function useMyHold() {
    const [hold, setHold] = useState<HoldResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function run<T>(action: () => Promise<T>): Promise<T> {
        setLoading(true);
        setError(null);
        return action().finally(() => setLoading(false));
    }

    function handleError(err: unknown): never {
        setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
        throw err;
    }

    const placeHold = useCallback((email: string, seatNumber: number) =>
        run(() => api.placeHold(email, seatNumber))
            .then((result) => (setHold(result), result))
            .catch(handleError), []);

    const extendHold = useCallback((email: string, code: string) =>
        run(() => api.extendHold(email, code))
            .then((result) => (setHold(result), result))
            .catch(handleError), []);

    const confirmHold = useCallback((email: string, code: string) =>
        run(() => api.confirmHold(email, code))
            .then((result) => (setHold(result), result))
            .catch(handleError), []);

    const releaseHold = useCallback((email: string, code: string) =>
        run(() => api.releaseHold(email, code))
            .then(() => setHold(null))
            .catch(handleError), []);

    return { hold, error, loading, placeHold, extendHold, confirmHold, releaseHold };
}