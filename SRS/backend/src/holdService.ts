import { randomUUID } from "crypto";
import { RESERVE_CONFIG } from "./config";
import { Clock } from "./clock";
import { CodeGenerator } from "./holdCodeGenerator";
import { Lock } from "./lock";
import { HoldRepository } from "./repositories/holdRepository";
import { SeatRepository } from "./repositories/seatRepository";
import { EventLogRepository } from "./repositories/eventLogRepository";
import {
  Hold,
  HoldResponse,
  PlaceHoldRequest,
  HoldActionRequest,
} from "./types";

// this will be thrown when a request breaks one of the reservation rules
// the "rule" will give our API a meaningful error that names which rule was violated
export class DomainError extends Error {
  constructor(
    public rule: string,
    message: string,
  ) {
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
    private clock: Clock,
  ) {}

  async placeHold(request: PlaceHoldRequest): Promise<HoldResponse> {
    const { email, seatNumber } = request;

    await this.lock.acquire(seatNumber);

    try {
      const seat = this.seatRepository.getSeat(seatNumber);

      if (!seat) {
        throw new DomainError(
          "SEAT_NOT_FOUND",
          `Seat ${seatNumber} does not exist.`,
        );
      }

      if (seat.status !== "available") {
        throw new DomainError(
          "SEAT_UNAVAILABLE",
          `Seat ${seatNumber} is not available.`,
        );
      }

      const activeHolds = this.holdRepository.findActiveByEmail(email);
      if (
        activeHolds.length >= RESERVE_CONFIG.MAXIMUM_CONCURRENT_HOLDS_PER_USER
      ) {
        throw new DomainError(
          "MAX_CONCURRENT_HOLDS",
          `You already have ${activeHolds.length} active hold(s).`,
        );
      }

      const oneHourAgo = this.clock.now() - 60 * 60 * 1000;
      const holdsThisHour = this.holdRepository.countByEmailSince(
        email,
        oneHourAgo,
      );
      if (holdsThisHour >= RESERVE_CONFIG.MAXIMUM_HOLDS_PER_USER_PER_HOUR) {
        throw new DomainError(
          "MAX_HOLDS_PER_HOUR",
          `You have reached the limit of ${RESERVE_CONFIG.MAXIMUM_HOLDS_PER_USER_PER_HOUR} holds per hour.`,
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

      return {
        code: hold.code,
        seatNumber: hold.seatNumber,
        expiresAt: hold.expiresAt!,
      };
    } finally {
      this.lock.release(seatNumber);
    }
  }

  private buildAndStoreHold(
        seatNumber: number,
        email: string,
        isAutoPromotion: boolean,
        eventType: "hold_placed" | "waitlist_promoted"
    ): HoldResponse {
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
            isAutoPromotion,
        };

        this.holdRepository.create(hold);
        this.seatRepository.updateSeatStatus(seatNumber, "held", hold.id);
        this.eventLogRepository.append({
            timestamp: now,
            type: eventType,
            seatNumber,
            email,
            holdCode: code,
        });

        return { code: hold.code, seatNumber: hold.seatNumber, expiresAt: hold.expiresAt };
    }

    // NEW — placeAutoHold goes right after the helper, since it's the only other caller
    async placeAutoHold(seatNumber: number, email: string): Promise<HoldResponse> {
        await this.lock.acquire(seatNumber);

        try {
            const seat = this.seatRepository.getSeat(seatNumber);

            if (!seat || seat.status !== "available") {
                throw new DomainError(
                    "SEAT_UNAVAILABLE",
                    `Seat ${seatNumber} is not available for auto-promotion.`
                );
            }

            return this.buildAndStoreHold(seatNumber, email, true, "waitlist_promoted");
        } finally {
            this.lock.release(seatNumber);
        }
    }

  // extending the hold
  async extendHold(request: HoldActionRequest): Promise<HoldResponse> {
    const { email, code } = request;

    // first find the hold by its code, if it doesn't exist there's nothing to extend
    const hold = this.holdRepository.findByCode(code);

    if (!hold) {
      throw new DomainError(
        "HOLD_NOT_FOUND",
        `No hold found for code ${code}.`,
      );
    }

    // lock the seat so nobody else can touch it while we're extending this hold
    // (e.g. the expiry scheduler kicking in at the exact same moment)
    await this.lock.acquire(hold.seatNumber);

    try {
      // make sure the person asking is actually the one who placed the hold
      if (hold.email !== email) {
        throw new DomainError(
          "EMAIL_MISMATCH",
          "This email does not match the hold.",
        );
      }

      // a confirmed seat doesn't expire anymore, so extending it makes no sense
      if (hold.status === "confirmed") {
        throw new DomainError(
          "HOLD_NOT_ACTIVE",
          "A confirmed seat cannot be extended.",
        );
      }

      // can't extend something that's already been released or expired
      if (hold.status === "released" || hold.status === "expired") {
        throw new DomainError(
          "HOLD_NOT_ACTIVE",
          "This hold is no longer active.",
        );
      }

      const now = this.clock.now();

      // catches the edge case where the hold technically expired a second ago
      // but the expiry scheduler hasn't swept it up and marked it "expired" yet
      if (hold.expiresAt !== null && hold.expiresAt < now) {
        throw new DomainError("HOLD_EXPIRED", "This hold has already expired.");
      }

      // enforce the max extensions rule, e.g. can't extend more than 2 times
      if (hold.extensionsUsed >= RESERVE_CONFIG.MAXIMUM_EXTENSIONS_PER_HOLD) {
        throw new DomainError(
          "MAX_EXTENSIONS_REACHED",
          `This hold has already been extended ${hold.extensionsUsed} time(s).`,
        );
      }

      // all checks passed, so push the expiry forward by a full window again
      // and bump the extension counter
      hold.expiresAt = now + RESERVE_CONFIG.HOLD_EXPIRY_TIME_SECONDS * 1000;
      hold.extensionsUsed += 1;
      this.holdRepository.update(hold);

      // record what just happened so the event log can rebuild this later
      this.eventLogRepository.append({
        timestamp: now,
        type: "hold_extended",
        seatNumber: hold.seatNumber,
        email: hold.email,
        holdCode: hold.code,
      });

      return {
        code: hold.code,
        seatNumber: hold.seatNumber,
        expiresAt: hold.expiresAt,
      };
    } finally {
      // always free the lock, even if one of the checks above threw
      this.lock.release(hold.seatNumber);
    }
  }

  // my  idempotency rule will happen here
  async confirmHold(request: HoldActionRequest): Promise<HoldResponse> {
    const { email, code } = request;

    const hold = this.holdRepository.findByCode(code);

    if (!hold) {
      throw new DomainError(
        "HOLD_NOT_FOUND",
        `No hold found for code ${code}.`,
      );
    }

    await this.lock.acquire(hold.seatNumber);

    try {
      if (hold.email !== email) {
        throw new DomainError(
          "EMAIL_MISMATCH",
          "This email does not match the hold.",
        );
      }

      // idempotency: confirming an already-confirmed hold with the
      // same email+code just returns the same result again, no error,
      // no state change, no new event log entry
      if (hold.status === "confirmed") {
        return {
          code: hold.code,
          seatNumber: hold.seatNumber,
          expiresAt: hold.expiresAt,
        };
      }

      if (hold.status === "released" || hold.status === "expired") {
        throw new DomainError(
          "HOLD_NOT_ACTIVE",
          "This hold is no longer active.",
        );
      }

      const now = this.clock.now();

      // still need to catch the "expired but scheduler hasn't swept it yet" case
      if (hold.expiresAt !== null && hold.expiresAt < now) {
        throw new DomainError("HOLD_EXPIRED", "This hold has already expired.");
      }

      hold.status = "confirmed";
      // confirmed seats no longer expire
      hold.expiresAt = null; 
      this.holdRepository.update(hold);

      this.seatRepository.updateSeatStatus(
        hold.seatNumber,
        "confirmed",
        hold.id,
      );

      this.eventLogRepository.append({
        timestamp: now,
        type: "hold_confirmed",
        seatNumber: hold.seatNumber,
        email: hold.email,
        holdCode: hold.code,
      });

      return { code: hold.code, seatNumber: hold.seatNumber, expiresAt: 0 };
    } finally {
      this.lock.release(hold.seatNumber);
    }
  }

  async releaseHold(request: HoldActionRequest): Promise<void> {
    const { email, code } = request;

    // find the hold by its code, if it doesn't exist there's nothing to release
    const hold = this.holdRepository.findByCode(code);

    if (!hold) {
        throw new DomainError("HOLD_NOT_FOUND", `No hold found for code ${code}.`);
    }

    // lock the seat so nothing else can change it mid-release
    // (e.g. the expiry scheduler or another release request at the same time)
    await this.lock.acquire(hold.seatNumber);

    try {
        // only the person who placed (or now holds/confirmed) this can release it
        if (hold.email !== email) {
            throw new DomainError("EMAIL_MISMATCH", "This email does not match the hold.");
        }

        // can't release something that's already been released or expired
        if (hold.status === "released" || hold.status === "expired") {
            throw new DomainError("HOLD_NOT_ACTIVE", "This hold is no longer active.");
        }

        const now = this.clock.now();

        // mark the hold as released and clear its expiry, this code can never be used again
        hold.status = "released";
        hold.expiresAt = null;
        this.holdRepository.update(hold);

        // free the seat back up, no hold id attached to it anymore
        this.seatRepository.updateSeatStatus(hold.seatNumber, "available", undefined);

        // record what just happened so the event log can rebuild this later
        this.eventLogRepository.append({
            timestamp: now,
            type: "hold_released",
            seatNumber: hold.seatNumber,
            email: hold.email,
            holdCode: hold.code,
        });
    } finally {
        // always free the lock, even if one of the checks above threw
        this.lock.release(hold.seatNumber);
    }
}
}
