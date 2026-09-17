// only one request at a time can hold the lock so that two concurrent request for the same sit can never both succeed

export interface Lock {
    acquire(key: number): Promise<void>;
    release(key: number): void;
}