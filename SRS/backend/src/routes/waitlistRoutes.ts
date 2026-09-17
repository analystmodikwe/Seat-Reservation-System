
import { Router } from "express";
import { waitlistService, waitlistRepository } from "../container";

const router = Router();

router.post("/", (req, res, next) => {
    const { email } = req.body;
    waitlistService
        .joinWaitlist({ email })
        .then(() => res.status(201).json({ message: "Joined waitlist" }))
        .catch(next);
});

router.get("/", (req, res) => {
    const entries = waitlistRepository.getAll();
    res.status(200).json(entries);
});

export default router;