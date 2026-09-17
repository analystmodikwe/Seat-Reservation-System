// These mirror SRS/backend/src/types.ts. Keep them in sync —
// if you ever move to a monorepo, share one package instead of copying.

export type SeatStatus = "available" | "held" | "confirmed";

export interface Seat {
  number: number;
  status: SeatStatus;
  holdId?: string;
}

export interface HoldResponse {
  code: string;
  seatNumber: number;
  expiresAt: number | null; // epoch ms; null once confirmed
}

export interface WaitlistEntry {
  email: string;
  joinedAt: number;
}

export type EventType =
  | "hold_placed"
  | "hold_extended"
  | "hold_confirmed"
  | "hold_released"
  | "hold_expired"
  | "waitlist_joined"
  | "waitlist_promoted";

export interface EventLogEntry {
  timestamp: number;
  type: EventType;
  seatNumber?: number;
  email: string;
  holdCode?: string;
}