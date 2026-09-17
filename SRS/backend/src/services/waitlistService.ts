import { Clock } from "../clock";
import { DomainError } from "./holdService";
import { HoldService } from "./holdService";
import { HoldRepository } from "../repositories/holdRepository";
import { SeatRepository } from "../repositories/seatRepository";
import { WaitlistRepository } from "../repositories/waitlistRepository";
import { EventLogRepository } from "../repositories/eventLogRepository";
import { JoinWaitlistRequest } from "../types";

export class WaitlistService {
    constructor(
        private waitlistRepository: WaitlistRepository,
        private seatRepository: SeatRepository,
        private holdRepository: HoldRepository,
        private eventLogRepository: EventLogRepository,
        private holdService: HoldService,
        private clock: Clock
    ) {}

    async joinWaitlist(request: JoinWaitlistRequest): Promise<void> {
        const { email } = request;

        // joining only makes sense when every seat is taken — if one's free,
        // the user should just place a hold instead
        const seats = this.seatRepository.getAllSeats();
        const hasAvailableSeat = seats.some((seat) => seat.status === "available");
        if (hasAvailableSeat) {
            throw new DomainError(
                "SEATS_AVAILABLE",
                "There are still available seats — place a hold instead of joining the waitlist."
            );
        }

        if (this.waitlistRepository.contains(email)) {
            throw new DomainError("ALREADY_ON_WAITLIST", "You are already on the waitlist.");
        }

        // can't join if you already have an active hold or a confirmed seat
        const existingHolds = this.holdRepository.findByEmail(email);
        const hasExisting = existingHolds.some(
            (hold) => hold.status === "active" || hold.status === "confirmed"
        );
        if (hasExisting) {
            throw new DomainError(
                "HAS_EXISTING_HOLD",
                "You already have an active hold or a confirmed seat."
            );
        }

        const now = this.clock.now();
        this.waitlistRepository.add({ email, joinedAt: now });

        this.eventLogRepository.append({
            timestamp: now,
            type: "waitlist_joined",
            email,
        });
    }

     async promoteNext(seatNumber: number): Promise<void> {
        // pull the longest-waiting user off the queue
        const nextInLine = this.waitlistRepository.removeFirst();

        // nobody waiting — nothing to do, seat just stays available
        if (!nextInLine) {
            return;
        }

        const holdResponse = await this.holdService.placeAutoHold(seatNumber, nextInLine.email);

        // "sending a notification" per the spec just means a clear log line for now
        console.log(
            `Seat ${seatNumber} offered to ${nextInLine.email} — hold code ${holdResponse.code}, expires at ${new Date(
                holdResponse.expiresAt!
            ).toISOString()}`
        );
    }
}



