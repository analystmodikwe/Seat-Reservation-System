// the piece that makes expiry/rate-limit tests possible without real waiting

import { Clock } from "../../src/clock";

export class FakeClock implements Clock {
    private current: number;

    constructor(start: number = 0) {
        this.current = start;
    }

    now(): number {
        return this.current;
    }

    advance(ms: number): void {
        this.current += ms;
    }
}