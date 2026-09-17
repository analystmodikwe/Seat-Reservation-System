import test from "node:test";
import assert from "node:assert/strict";
import { HoldService } from "../src/services/holdService";
import { InMemorySeatRepository } from "../src/repositories/seatRepository";
import { InMemoryHoldRepository } from "../src/repositories/holdRepository";
import { InMemoryEventLogRepository } from "../src/repositories/eventLogRepository";
import { HoldCodeGenerator } from "../src/generators/holdCodeGenerator";
import { InMemoryLock } from "../src/lock";
import { FakeClock } from "./helpers/fakeClock";
import { RESERVE_CONFIG } from "../src/config";

// Builds a fresh set of dependencies for each test, so tests
// never leak state into each other.
function setup(seatCount: number = 3) {
    const clock = new FakeClock(0);
    const lock = new InMemoryLock();
    const seatRepository = new InMemorySeatRepository(seatCount);
    const holdRepository = new InMemoryHoldRepository();
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

    return { clock, seatRepository, holdRepository, eventLogRepository, holdService };
}

test("placeHold returns a 6-character code using only allowed characters", async () => {
    const { holdService } = setup();

    const result = await holdService.placeHold({ email: "a@test.com", seatNumber: 1 });

    assert.equal(result.code.length, RESERVE_CONFIG.HOLD_CODE_LENGTH);

    for (const char of result.code) {
        assert.ok(
            RESERVE_CONFIG.HOLD_CODE_CHARACTERS.includes(char),
            `Character "${char}" is not in the allowed alphabet`
        );
    }
});

test("placeHold generates unique codes across multiple holds", async () => {
    const { holdService } = setup(5);

    const codes = new Set<string>();
    for (let seat = 1; seat <= 5; seat++) {
        const result = await holdService.placeHold({ email: `user${seat}@test.com`, seatNumber: seat });
        codes.add(result.code);
    }

    assert.equal(codes.size, 5, "expected all 5 generated codes to be unique");
});

test("placeHold rejects a seat that's already held", async () => {
    const { holdService } = setup();

    await holdService.placeHold({ email: "first@test.com", seatNumber: 1 });

    await assert.rejects(
        () => holdService.placeHold({ email: "second@test.com", seatNumber: 1 }),
        (error: any) => error.rule === "SEAT_UNAVAILABLE"
    );
});

test("placeHold enforces the max concurrent holds per user", async () => {
    const { holdService } = setup(5);
    const email = "user@test.com";

    // default MAXIMUM_CONCURRENT_HOLDS_PER_USER is 2
    await holdService.placeHold({ email, seatNumber: 1 });
    await holdService.placeHold({ email, seatNumber: 2 });

    await assert.rejects(
        () => holdService.placeHold({ email, seatNumber: 3 }),
        (error: any) => error.rule === "MAX_CONCURRENT_HOLDS"
    );
});

test("placeHold enforces the max holds per user per hour", async () => {
    const { holdService, clock } = setup(10);
    const email = "user@test.com";

    // default MAXIMUM_HOLDS_PER_USER_PER_HOUR is 5 — release each one
    // immediately so we're only testing the hourly count, not the
    // concurrent-holds limit
    for (let i = 1; i <= 5; i++) {
        const result = await holdService.placeHold({ email, seatNumber: i });
        await holdService.releaseHold({ email, code: result.code });
    }

    await assert.rejects(
        () => holdService.placeHold({ email, seatNumber: 6 }),
        (error: any) => error.rule === "MAX_HOLDS_PER_HOUR"
    );
});

test("hold expires after the configured time and frees the seat", async () => {
    const { holdService, holdRepository, seatRepository, clock } = setup();

    const result = await holdService.placeHold({ email: "user@test.com", seatNumber: 1 });

    // jump time forward past the expiry window instantly
    clock.advance(RESERVE_CONFIG.HOLD_EXPIRY_TIME_SECONDS * 1000 + 1000);

    const hold = holdRepository.findByCode(result.code)!;
    const freedSeatNumber = await holdService.expireHold(hold.id);

    assert.equal(freedSeatNumber, 1);
    assert.equal(holdRepository.findByCode(result.code)!.status, "expired");
    assert.equal(seatRepository.getSeat(1)!.status, "available");
});

test("confirming a hold is idempotent", async () => {
    const { holdService } = setup();
    const email = "user@test.com";

    const placed = await holdService.placeHold({ email, seatNumber: 1 });

    const firstConfirm = await holdService.confirmHold({ email, code: placed.code });
    const secondConfirm = await holdService.confirmHold({ email, code: placed.code });

    assert.deepEqual(firstConfirm, secondConfirm);
});