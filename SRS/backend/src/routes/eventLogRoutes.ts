import { Router } from "express";

const router = Router();

// Get all event log entries
router.get("/", (req, res) => {
    res.json({
        message: "Get all event logs",
    });
});

// Get event logs for a specific seat
router.get("/seat/:seatNumber", (req, res) => {
    res.json({
        message: `Get logs for seat ${req.params.seatNumber}`,
    });
});

export default router;