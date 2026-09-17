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
}