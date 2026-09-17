import { Hold } from '../types';

// finding a hold by its unique hold code returning that hold if found
// finding all active holds belonging to a specific email
// counting how many holds the email has created since the given timestamp
// update an existing hold in the repository
export interface HoldRepository {
    findByCode(code: string): Hold | undefined;
    findActiveByEmail(email: string): Hold[];
    countByEmailSince(email: string, since: number): number;
    create(hold: Hold): void;
    update(hold: Hold): void;
}


// this will be my database replacement, the in-memory implementation of hold repository storing the holds in a map

// stores holds using the hold code as the key
// look for a hold by its code and map will return it if the code exists
export class InMemoryHoldRepository implements HoldRepository {
    private holds: Map<string, Hold> = new Map();
    findByCode(code: string): Hold | undefined {
        return this.holds.get(code);
    }

    // finding active holds belonging to a specific email
    // get all objects stored in map then keep only those with matching email and active status
    findActiveByEmail(email: string): Hold[] {
        return [...this.holds.values()].filter(
            (hold) => hold.email === email && hold.status === 'active'
        );
    }

    
}