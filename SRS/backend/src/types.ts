// this file Defines the types used throughout the booking system, including seats, holds, waitlists, event logs, API requests, and errors.

// Defines a seat's allowed status and stores its number and optional hold ID.
export type SeatStatus = "available"  | "held" | "confirmed";

export interface Seat {
    number: number;
    status: SeatStatus;
    holdId?: string;
}


// Defines the possible states of a seat hold.
// null once its confirmed because confirmed seats dont expire
// boolean=true when created via waitlist promotion
export type HoldStatus = "active" | "confirmed" | "expired" | "released";

export interface Hold {
    id: string; 
    code: string; 
    seatNumber: number;
    email: string;
    status: HoldStatus;
    createdAt: number;
    expiresAt: number | null;
    extensionsUsed: number;
    isAutoPromotion: boolean;
}

export interface WaitlistEntry {
    email: string;
    joinedAt: number;
}