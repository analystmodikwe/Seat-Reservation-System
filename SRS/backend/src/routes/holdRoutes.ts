
import { Router } from "express";
import { holdService, waitlistService } from "../container";
import { DomainError } from "../services/holdService";

const router = Router();

// Place a hold on a seat
router.post("/", async (req, res) => {
    try {
        const { email, seatNumber } = req.body;
        const result = await holdService.placeHold({ email, seatNumber });
        res.status(201).json(result);
    } catch (error) {
        handleError(error, res);
    }
}); 

// Extend a hold
router.post("/extend", async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await holdService.extendHold({ email, code });
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
});

// Confirm a hold
router.post("/confirm", async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await holdService.confirmHold({ email, code });
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
});

// Release a hold
router.post("/release", async (req, res) => {
    try {
        const { email, code } = req.body;
        const freedSeatNumber = await holdService.releaseHold({ email, code });

        // seat freed up — check if anyone's waiting for it
        await waitlistService.promoteNext(freedSeatNumber);

        res.status(200).json({ message: "Hold released" });
    } catch (error) {
        handleError(error, res);
    }
});

// Shared error handling for every route above: turns a DomainError
// into a consistent { rule, message } response, anything else into
// a generic 500 so unexpected bugs don't leak internal details.
function handleError(error: unknown, res: import("express").Response): void {
    if (error instanceof DomainError) {
        res.status(400).json({ rule: error.rule, message: error.message });
        return;
    }

    console.error("Unexpected error:", error);
    res.status(500).json({ rule: "INTERNAL_ERROR", message: "Something went wrong." });
}

export default router;