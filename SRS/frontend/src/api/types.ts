export type SeatStatus = "available" | "held" | "confirmed";

export interface Seat {
    number: number;
    status: SeatStatus;
    holdId?: string;
}

export interface HoldResponse {
    code: string;
    seatNumber: number;
    expiresAt: number | null;
}

export interface WaitlistEntry {
    email: string;
    joinedAt: number;
}

export interface EventLogEntry {
    timestamp: number;
    type:
        | "hold_placed"
        | "hold_extended"
        | "hold_confirmed"
        | "hold_released"
        | "hold_expired"
        | "waitlist_joined"
        | "waitlist_promoted";
    seatNumber?: number;
    email: string;
    holdCode?: string;
}

export interface ApiError {
    rule: string;
    message: string;
}