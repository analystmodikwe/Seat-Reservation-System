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

     // Exposed separately from start() so tests can call one sweep
    // directly, using a FakeClock, without waiting on a real interval.
    async runOnce(): Promise<void> {
        const now = this.clock.now();
        const activeHolds = this.holdRepository.findAllActive();

        const expiredHolds = activeHolds.filter(
            (hold) => hold.expiresAt !== null && hold.expiresAt < now
        );

        for (const hold of expiredHolds) {
            const freedSeatNumber = await this.holdService.expireHold(hold.id);

            // expireHold re-checks state under its own lock and can return
            // null if the hold was extended/confirmed/released in the gap
            // between this scan and the lock being acquired — nothing to
            // promote in that case
            if (freedSeatNumber !== null) {
                await this.waitlistService.promoteNext(freedSeatNumber);
            }
        }
    }
}