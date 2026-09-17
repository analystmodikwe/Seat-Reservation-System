import { SystemClock } from "./clock";
import { InMemoryLock } from "./lock";
import { HoldCodeGenerator } from "./generators/holdCodeGenerator";
import { InMemorySeatRepository } from "./repositories/seatRepository";
import { InMemoryHoldRepository } from "./repositories/holdRepository";
import { InMemoryWaitlistRepository } from "./repositories/waitlistRepository";
import { InMemoryEventLogRepository } from "./repositories/eventLogRepository";
import { HoldService } from "./services/holdService";
import { WaitlistService } from "./services/waitlistService";
import { ExpiryScheduler } from "./services/expiryScheduler";
import { RESERVE_CONFIG } from "./config";

// Single place where every concrete implementation gets created and
// wired together. Nothing outside this file should ever call `new`
// on a repository or service directly — that's what keeps the rest
// of the app depending on interfaces, not concrete classes.

const clock = new SystemClock();
const lock = new InMemoryLock();

const seatRepository = new InMemorySeatRepository(RESERVE_CONFIG.SEATS_PER_EVENT);
const holdRepository = new InMemoryHoldRepository();
const waitlistRepository = new InMemoryWaitlistRepository();
const eventLogRepository = new InMemoryEventLogRepository();

const codeGenerator = new HoldCodeGenerator(holdRepository);

const holdService = new HoldService(
    seatRepository,
    holdRepository,
    eventLogRepository,
    codeGenerator,
    lock,
    clock
);

const waitlistService = new WaitlistService(
    waitlistRepository,
    seatRepository,
    holdRepository,
    eventLogRepository,
    holdService,
    clock
);

const expiryScheduler = new ExpiryScheduler(
    holdRepository,
    holdService,
    waitlistService,
    clock
);

export {
    clock,
    lock,
    seatRepository,
    holdRepository,
    waitlistRepository,
    eventLogRepository,
    codeGenerator,
    holdService,
    waitlistService,
    expiryScheduler,
};