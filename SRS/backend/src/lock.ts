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

        // already held - queue up and wait for your turn
        return new Promise<void>((resolve) => {
            const queue = this.waiters.get(key) ?? [];
            queue.push(resolve);
            this.waiters.set(key, queue);
        });
    }

    release(key: number): void {
        const queue = this.waiters.get(key);

        if (queue && queue.length > 0) {
            // Hand the lock directly to the next waiter in line —
            // key stays in `locked` the whole time, it just changes hands.
            const next = queue.shift()!;
            next();
        } else {
            this.locked.delete(key);
        }
    }

}   