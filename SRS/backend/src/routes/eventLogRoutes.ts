// src/routes/eventLogRoutes.ts
import { Router } from "express";
import { eventLogRepository } from "../container";

const router = Router();

// Get all event log entries
router.get("/", (req, res) => {
    const entries = eventLogRepository.getAll();
    res.status(200).json(entries);
});

// Get event log entries for a specific seat
router.get("/seat/:seatNumber", (req, res) => {
    const seatNumber = Number(req.params.seatNumber);
    const entries = eventLogRepository.getBySeat(seatNumber);
    res.status(200).json(entries);
});

export default router;