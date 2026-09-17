import { WaitlistEntry } from "../types";

// Ordered queue of users waiting for a seat. Preserves join order:
// first to join is first to be promoted when a seat frees up.
export interface WaitlistRepository {
    add(entry: WaitlistEntry): void;

    removeFirst(): WaitlistEntry | undefined;

    contains(email: string): boolean;

    getAll(): WaitlistEntry[];
}