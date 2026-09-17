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
