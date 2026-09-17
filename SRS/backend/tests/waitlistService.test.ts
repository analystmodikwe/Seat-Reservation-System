// tests/waitlistService.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { HoldService } from "../src/services/holdService";
import { WaitlistService } from "../src/services/waitlistService";
import { InMemorySeatRepository } from "../src/repositories/seatRepository";
import { InMemoryHoldRepository } from "../src/repositories/holdRepository";
import { InMemoryWaitlistRepository } from "../src/repositories/waitlistRepository";
import { InMemoryEventLogRepository } from "../src/repositories/eventLogRepository";
import { HoldCodeGenerator } from "../src/generators/holdCodeGenerator";
import { InMemoryLock } from "../src/lock";
import { FakeClock } from "./helpers/fakeClock";
import { RESERVE_CONFIG } from "../src/config";

// Builds a fresh HoldService + WaitlistService pair for each test.
function setup(seatCount: number = 3) {
    const clock = new FakeClock(0);
    const lock = new InMemoryLock();
    const seatRepository = new InMemorySeatRepository(seatCount);
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

    return {
        clock,
        seatRepository,
        holdRepository,
        waitlistRepository,
        eventLogRepository,
        holdService,
        waitlistService,
    };
}

// Fills every seat with a distinct user by placing a hold on each one.
// Returns the email used for each seat number, so tests can pick one
// of these "filler" users to act as the person being tested.
async function fillAllSeats(
    holdService: HoldService,
    seatCount: number
): Promise<Map<number, string>> {
    const emailBySeat = new Map<number, string>();

    for (let seat = 1; seat <= seatCount; seat++) {
        const email = `filler${seat}@test.com`;
        await holdService.placeHold({ email, seatNumber: seat });
        emailBySeat.set(seat, email);
    }

    return emailBySeat;
}

test("joinWaitlist rejects when seats are still available", async () => {
    const { waitlistService } = setup(3);

    await assert.rejects(
        () => waitlistService.joinWaitlist({ email: "user@test.com" }),
        (error: any) => error.rule === "SEATS_AVAILABLE"
    );
});

test("joinWaitlist succeeds once every seat is taken", async () => {
    const { holdService, waitlistService, waitlistRepository } = setup(2);

    await fillAllSeats(holdService, 2);

    await waitlistService.joinWaitlist({ email: "waiter@test.com" });

    const entries = waitlistRepository.getAll();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].email, "waiter@test.com");
});

test("joinWaitlist rejects a user who is already on the waitlist", async () => {
    const { holdService, waitlistService } = setup(2);

    await fillAllSeats(holdService, 2);
    await waitlistService.joinWaitlist({ email: "waiter@test.com" });

    await assert.rejects(
        () => waitlistService.joinWaitlist({ email: "waiter@test.com" }),
        (error: any) => error.rule === "ALREADY_ON_WAITLIST"
    );
});

test("joinWaitlist rejects a user who already has an active hold", async () => {
    const { holdService, waitlistService } = setup(2);

    // seat 1's filler user already holds a seat, so all seats are full,
    // but that same user shouldn't be able to also join the waitlist
    const emailBySeat = await fillAllSeats(holdService, 2);
    const existingHolder = emailBySeat.get(1)!;

    await assert.rejects(
        () => waitlistService.joinWaitlist({ email: existingHolder }),
        (error: any) => error.rule === "HAS_EXISTING_HOLD"
    );
});

test("promoteNext promotes waitlisted users in join order (FIFO)", async () => {
    const { holdService, waitlistService, holdRepository } = setup(2);

    await fillAllSeats(holdService, 2);

    await waitlistService.joinWaitlist({ email: "first@test.com" });
    await waitlistService.joinWaitlist({ email: "second@test.com" });

    // release seat 1 — one spot opens up
    const seat1Hold = holdRepository.findByEmail("filler1@test.com")[0];
    const freedSeatNumber = await holdService.releaseHold({
        email: "filler1@test.com",
        code: seat1Hold.code,
    });

    await waitlistService.promoteNext(freedSeatNumber);

    const firstUserHolds = holdRepository.findByEmail("first@test.com");
    const secondUserHolds = holdRepository.findByEmail("second@test.com");

    assert.equal(firstUserHolds.length, 1, "first-in-line should now hold the freed seat");
    assert.equal(firstUserHolds[0].seatNumber, freedSeatNumber);
    assert.equal(firstUserHolds[0].isAutoPromotion, true);
    assert.equal(secondUserHolds.length, 0, "second-in-line should still be waiting");
});

test("promoteNext does nothing when the waitlist is empty", async () => {
    const { holdService, waitlistService, holdRepository } = setup(2);

    await fillAllSeats(holdService, 2);

    const seat1Hold = holdRepository.findByEmail("filler1@test.com")[0];
    const freedSeatNumber = await holdService.releaseHold({
        email: "filler1@test.com",
        code: seat1Hold.code,
    });

    // should not throw, should just leave the seat available
    await waitlistService.promoteNext(freedSeatNumber);
});

test("if an auto-promoted hold expires, the seat is re-offered to the next waitlisted user", async () => {
    const { holdService, waitlistService, holdRepository, clock } = setup(2);

    await fillAllSeats(holdService, 2);

    await waitlistService.joinWaitlist({ email: "first@test.com" });
    await waitlistService.joinWaitlist({ email: "second@test.com" });

    const seat1Hold = holdRepository.findByEmail("filler1@test.com")[0];
    const freedSeatNumber = await holdService.releaseHold({
        email: "filler1@test.com",
        code: seat1Hold.code,
    });

    // first@test.com gets auto-promoted onto the freed seat
    await waitlistService.promoteNext(freedSeatNumber);

    const firstUsersHold = holdRepository.findByEmail("first@test.com")[0];

    // let the auto-hold's expiry pass without confirming it
    clock.advance(RESERVE_CONFIG.HOLD_EXPIRY_TIME_SECONDS * 1000 + 1000);
    const reFreedSeatNumber = await holdService.expireHold(firstUsersHold.id);

    assert.notEqual(reFreedSeatNumber, null, "expireHold should report the seat as freed");

    // re-offer it — second@test.com should get it now
    await waitlistService.promoteNext(reFreedSeatNumber!);

    const secondUsersHolds = holdRepository.findByEmail("second@test.com");
    assert.equal(secondUsersHolds.length, 1, "second-in-line should now hold the re-offered seat");
    assert.equal(secondUsersHolds[0].isAutoPromotion, true);
});