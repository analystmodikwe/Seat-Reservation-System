// tests/concurrency.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { HoldService } from "../src/services/holdService";
import { InMemorySeatRepository } from "../src/repositories/seatRepository";
import { InMemoryHoldRepository } from "../src/repositories/holdRepository";
import { InMemoryEventLogRepository } from "../src/repositories/eventLogRepository";
import { HoldCodeGenerator } from "../src/generators/holdCodeGenerator";
import { InMemoryLock } from "../src/lock";
import { FakeClock } from "./helpers/fakeClock";

function setup(seatCount: number = 1) {
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

    return { seatRepository, holdRepository, holdService };
}

test("only one of two simultaneous holds on the same seat succeeds", async () => {
    const { holdService } = setup(1);

    const [resultA, resultB] = await Promise.allSettled([
        holdService.placeHold({ email: "userA@test.com", seatNumber: 1 }),
        holdService.placeHold({ email: "userB@test.com", seatNumber: 1 }),
    ]);

    const outcomes = [resultA, resultB];
    const fulfilled = outcomes.filter((r) => r.status === "fulfilled");
    const rejected = outcomes.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "exactly one request should succeed");
    assert.equal(rejected.length, 1, "exactly one request should be rejected");

    const rejection = rejected[0] as PromiseRejectedResult;
    assert.equal(rejection.reason.rule, "SEAT_UNAVAILABLE");
});

test("only one of many simultaneous holds on the same seat succeeds", async () => {
    const { holdService } = setup(1);

    const attempts = Array.from({ length: 10 }, (_, i) =>
        holdService.placeHold({ email: `user${i}@test.com`, seatNumber: 1 })
    );

    const results = await Promise.allSettled(attempts);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "exactly one of 10 concurrent requests should succeed");
    assert.equal(rejected.length, 9);

    for (const r of rejected as PromiseRejectedResult[]) {
        assert.equal(r.reason.rule, "SEAT_UNAVAILABLE");
    }
});

test("seat state is consistent after a burst of concurrent extend/release/confirm on different holds", async () => {
    const { holdService, seatRepository } = setup(3);

    // place three holds on three separate seats concurrently — these
    // shouldn't interfere with each other since each has its own lock
    const [holdA, holdB, holdC] = await Promise.all([
        holdService.placeHold({ email: "a@test.com", seatNumber: 1 }),
        holdService.placeHold({ email: "b@test.com", seatNumber: 2 }),
        holdService.placeHold({ email: "c@test.com", seatNumber: 3 }),
    ]);

    assert.equal(seatRepository.getSeat(1)!.status, "held");
    assert.equal(seatRepository.getSeat(2)!.status, "held");
    assert.equal(seatRepository.getSeat(3)!.status, "held");

    await Promise.all([
        holdService.confirmHold({ email: "a@test.com", code: holdA.code }),
        holdService.releaseHold({ email: "b@test.com", code: holdB.code }),
        holdService.extendHold({ email: "c@test.com", code: holdC.code }),
    ]);

    assert.equal(seatRepository.getSeat(1)!.status, "confirmed");
    assert.equal(seatRepository.getSeat(2)!.status, "available");
    assert.equal(seatRepository.getSeat(3)!.status, "held");
});