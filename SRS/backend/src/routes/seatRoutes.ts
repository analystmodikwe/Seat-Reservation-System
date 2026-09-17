// src/routes/seatRoutes.ts
import { Router } from "express";
import { seatRepository } from "../container";

const router = Router();

// Get all seats and their current status
router.get("/", (req, res) => {
    const seats = seatRepository.getAllSeats();
    res.status(200).json(seats);
});

export default router;