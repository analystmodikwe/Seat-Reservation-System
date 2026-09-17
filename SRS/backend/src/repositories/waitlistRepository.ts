import { WaitlistEntry } from "../types";

// Ordered queue of users waiting for a seat. Preserves join order:
// first to join is first to be promoted when a seat frees up.
export interface WaitlistRepository {
    add(entry: WaitlistEntry): void;

    removeFirst(): WaitlistEntry | undefined;

    contains(email: string): boolean;

    getAll(): WaitlistEntry[];
}


export class InMemoryWaitlistRepository implements WaitlistRepository {
    // an array to preserve insertion order for the waitlist
    // adding user to the end of the waitlist
    private entries: WaitlistEntry[] = [];

    add(entry: WaitlistEntry): void {
        this.entries.push(entry);
    }

    // Removes and returns the first (longest-waiting) entry,
    // or undefined if the waitlist is empty.
    removeFirst(): WaitlistEntry | undefined {
        return this.entries.shift();
    }

    // Checks if an email is already on the waitlist —
    // used to enforce "can't join if already on it."
    contains(email: string): boolean {
        return this.entries.some((entry) => entry.email === email);
    }

    // Returns the full waitlist, in join order. Read-only view
    // for the event log / any future "waitlist position" screen.
    getAll(): WaitlistEntry[] {
        return [...this.entries];
    }

}









