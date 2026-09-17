import type { Seat, HoldResponse, WaitlistEntry, EventLogEntry } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// A custom Error subclass that carries the backend's `rule` string.
// This lets components branch on the rule (e.g. show the waitlist
// button when SEAT_UNAVAILABLE) instead of string-matching messages.
export class ApiError extends Error {
  rule: string;
  message: string;

  constructor(rule: string, message: string) {
    super(message);
    this.rule = rule;
    this.message = message;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on network failure, never on a 4xx/5xx
    throw new ApiError("NETWORK_ERROR", "Can't reach the server. Is the backend running?");
  }

  // Read as text first: some endpoints could return an empty body,
  // and res.json() throws on an empty string.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.rule ?? "UNKNOWN_ERROR", data?.message ?? res.statusText);
  }

  return data as T;
}

export const api = {
  getSeats: () => request<Seat[]>("/seats"),

  placeHold: (email: string, seatNumber: number) =>
    request<HoldResponse>("/holds", { email, seatNumber }),

  extendHold: (email: string, code: string) =>
    request<HoldResponse>("/holds/extend", { email, code }),

  confirmHold: (email: string, code: string) =>
    request<HoldResponse>("/holds/confirm", { email, code }),

  releaseHold: (email: string, code: string) =>
    request<{ message: string }>("/holds/release", { email, code }),

  joinWaitlist: (email: string) =>
    request<{ message: string }>("/waitlist", { email }),

  getWaitlist: () => request<WaitlistEntry[]>("/waitlist"),

  getEvents: () => request<EventLogEntry[]>("/events"),
};