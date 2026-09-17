import { EventLogEntry } from "../types";

// Append-only log of every state change (hold placed, extended,
// confirmed, released, expired, waitlist joined, waitlist promoted).
// Nothing here ever mutates or deletes an entry — the current state
// of any seat must be reconstructable from this log alone.

export interface EventLogRepository {
    append(entry: EventLogEntry): void;

    getAll(): EventLogEntry[];

    getBySeat(seatNumber: number): EventLogEntry[];
}

export class InMemoryEventLogRepository implements EventLogRepository {

    // Array in insertion order — the log's chronological order
    // IS its meaning, same reasoning as the waitlist.
    private entries: EventLogEntry[] = [];

    // Adds a new entry to the end of the log. No update/remove
    // methods exist on purpose — this repository must never
    // let anything mutate history.
    append(entry: EventLogEntry): void {
        this.entries.push(entry);
    }

    // Returns the full log, in chronological order.
    getAll(): EventLogEntry[] {
        return [...this.entries];
    }

    // Returns only the entries for one seat, still in
    // chronological order — powers the event log screen's
    // "filter by seat number" requirement.
    getBySeat(seatNumber: number): EventLogEntry[] {
        return this.entries.filter((entry) => entry.seatNumber === seatNumber);
    }
}