
import { Router } from "express";
import { waitlistService, waitlistRepository } from "../container";
import { DomainError } from "../services/holdService";

const router = Router();

// Join the waitlist
router.post("/", async (req, res) => {
    try {
        const { email } = req.body;
        await waitlistService.joinWaitlist({ email });
        res.status(201).json({ message: "Joined waitlist" });
    } catch (error) {
        handleError(error, res);
    }
});

// Get the current waitlist, in join order
router.get("/", (req, res) => {
    const entries = waitlistRepository.getAll();
    res.status(200).json(entries);
});

function handleError(error: unknown, res: import("express").Response): void {
    if (error instanceof DomainError) {
        res.status(400).json({ rule: error.rule, message: error.message });
        return;
    }

    console.error("Unexpected error:", error);
    res.status(500).json({ rule: "INTERNAL_ERROR", message: "Something went wrong." });
}

export default router;