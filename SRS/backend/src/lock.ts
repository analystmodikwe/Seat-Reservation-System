// only one request at a time can hold the lock so that two concurrent request for the same sit can never both succeed

export interface Lock {
    acquire(key: number): Promise<void>;
    release(key: number): void;
}

export class InMemoryLock implements Lock {
    private locked: Set<number> = new Set();
    private waiters: Map<number, Array<() => void>> = new Map();

    // nobody holds it
    acquire(key: number): Promise<void> {
        if(!this.locked.has(key)) {
            this.locked.add(key);
            return Promise.resolve();
        }
    }
}