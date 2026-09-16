// creating a small abstraction around time so the my services dont directly use Date.now()
// when the app ask for clock, it gets the system time

export interface Clock {
    now(): number;
}

export class SystemClock implements Clock {
    now(): number {
        return Date.now();
    }
}