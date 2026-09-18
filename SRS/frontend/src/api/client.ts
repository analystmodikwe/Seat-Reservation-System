import { Seat, HoldResponse, WaitlistEntry, EventLogEntry, ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// Custom error class so components can check `error.rule` the same
// way your backend's DomainError does — keeps the "which rule was
// violated" story consistent end to end.
export class ApiRequestError extends Error {
    constructor(public rule: string, message: string) {
        super(message);
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!response.ok) {
        const body: ApiError = await response.json();
        throw new ApiRequestError(body.rule, body.message);
    }

    // 204/empty responses don't have a body to parse
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export const api = {
    getSeats: (): Promise<Seat[]> => request("/seats"),

    placeHold: (email: string, seatNumber: number): Promise<HoldResponse> =>
        request("/holds", {
            method: "POST",
            body: JSON.stringify({ email, seatNumber }),
        }),

    extendHold: (email: string, code: string): Promise<HoldResponse> =>
        request("/holds/extend", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        }),

    confirmHold: (email: string, code: string): Promise<HoldResponse> =>
        request("/holds/confirm", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        }),

    releaseHold: (email: string, code: string): Promise<{ message: string }> =>
        request("/holds/release", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        }),

    joinWaitlist: (email: string): Promise<{ message: string }> =>
        request("/waitlist", {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    getWaitlist: (): Promise<WaitlistEntry[]> => request("/waitlist"),

    getEventLog: (seatNumber?: number): Promise<EventLogEntry[]> =>
        request(seatNumber ? `/events/seat/${seatNumber}` : "/events"),
};