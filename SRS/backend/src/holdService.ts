import { randomUUID } from "crypto";
import { RESERVE_CONFIG } from "./config";
import { Clock } from "./clock";
import { CodeGenerator } from "./holdCodeGenerator";
import { Lock } from "./lock";
import { HoldRepository } from "./repositories/holdRepository";
import { SeatRepository } from "./repositories/seatRepository";
import { EventLogRepository } from "./repositories/eventLogRepository";
import { Hold, HoldResponse, PlaceHoldRequest } from "./types";

// this will be thrown when a request breaks one of the reservation rules
// the "rule" will give our API a meaningful error that names which rule was violated
export class DomainError extends Error {
    constructor(public rule: string, message: string) {
        super(message);
    }
}

export class HoldService {
    constructor(
        private seatRepository: SeatRepository,
        private holdRepository: HoldRepository,
        private eventLogRepository: EventLogRepository,
        private codeGenerator: CodeGenerator,
        private lock: Lock,
        private clock: Clock
    ) {}

    async placeHold(request: PlaceHoldRequest): Promise<HoldResponse> {
        const { email, seatNumber } = request;

        await this.lock.acquire(seatNumber);

        try {
            const seat = this.seatRepository.getSeat(seatNumber);

            if (!seat) {
                throw new DomainError("SEAT_NOT_FOUND", `Seat ${seatNumber} does not exist.`);
            }

            if (seat.status !== "available") {
                throw new DomainError("SEAT_UNAVAILABLE", `Seat ${seatNumber} is not available.`);
            }

            const activeHolds = this.holdRepository.findActiveByEmail(email);
            if (activeHolds.length >= RESERVE_CONFIG.MAXIMUM_CONCURRENT_HOLDS_PER_USER) {
                throw new DomainError(
                    "MAX_CONCURRENT_HOLDS",
                    `You already have ${activeHolds.length} active hold(s).`
                );
            }

            const oneHourAgo = this.clock.now() - 60 * 60 * 1000;
            const holdsThisHour = this.holdRepository.countByEmailSince(email, oneHourAgo);
            if (holdsThisHour >= RESERVE_CONFIG.MAXIMUM_HOLDS_PER_USER_PER_HOUR) {
                throw new DomainError(
                    "MAX_HOLDS_PER_HOUR",
                    `You have reached the limit of ${RESERVE_CONFIG.MAXIMUM_HOLDS_PER_USER_PER_HOUR} holds per hour.`
                );
            }

            const code = this.codeGenerator.generateCode();
            const now = this.clock.now();

            const hold: Hold = {
                id: randomUUID(),
                code,
                seatNumber,
                email,
                status: "active",
                createdAt: now,
                expiresAt: now + RESERVE_CONFIG.HOLD_EXPIRY_TIME_SECONDS * 1000,
                extensionsUsed: 0,
                isAutoPromotion: false,
            };

            this.holdRepository.create(hold);
            this.seatRepository.updateSeatStatus(seatNumber, "held", hold.id);
            this.eventLogRepository.append({
                timestamp: now,
                type: "hold_placed",
                seatNumber,
                email,
                holdCode: code,
            });

            return { code: hold.code, seatNumber: hold.seatNumber, expiresAt: hold.expiresAt };
        } finally {
            this.lock.release(seatNumber);
        }
    }
}

