// this file Defines the types used throughout the booking system, including seats, holds, waitlists, event logs, API requests, and errors.

// Defines a seat's allowed status and stores its number and optional hold ID.
export type SeatStatus = "available"  | "held" | "confirmed";

export interface Seat {
    number: number;
    status: SeatStatus;
    holdId?: string;
}


// Defines the possible states of a seat hold.
// null- once its confirmed because confirmed seats dont expire
// boolean- true when created via waitlist promotion
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

// Defines the different actions that can be recorded in the event log.
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
    seatNumber: number;
    email: string;
    holdCode?: string;
}

// shaping the API'S Defines the data expected when placing a seat hold.
export interface PlaceHoldRequest {
    email: string ;
    seatNumber: number;
}

// Defines the data returned after successfully placing a hold.
export interface HoldResponse {
    code: string;
    seatNumber: number;
    expiresAt: number | null;
}

// extend, confirm or release
export interface HoldActionRequest {
    email: string;
    code: string;
}


// Defines the data needed to join the waitlist.
export interface JoinWaitlistRequest {
    email: string;
}

// rule will check for wich rule was violated
// Defines the error information returned when a booking rule is violated.
export interface ApiError {
    rule: string;
    message: string;
}



