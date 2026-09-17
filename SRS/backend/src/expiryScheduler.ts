import { Clock } from "./clock";
import { HoldService } from "./holdService";
import { WaitlistService } from "./waitlistService";
import { HoldRepository } from "./repositories/holdRepository";

// Periodically checks for holds that have passed their expiry time,
// expires them, and offers the freed seat to the next person waiting.
// The spec allows a check every 1-2 seconds rather than exact-millisecond
// timing, so a simple interval is enough here.

export class ExpiryScheduler {
    private intervalHandle: ReturnType<typeof setInterval> | null = null;

    constructor(
        private holdRepository: HoldRepository,
        private holdService: HoldService,
        private waitlistService: WaitlistService,
        private clock: Clock,
        private intervalMs: number = 1000
    ) {}

    start(): void {
        this.intervalHandle = setInterval(() => {
            this.runOnce().catch((error) => {
                // a single failed sweep shouldn't crash the whole server
                console.error("Expiry scheduler sweep failed:", error);
            });
        }, this.intervalMs);
    }

    stop(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
}