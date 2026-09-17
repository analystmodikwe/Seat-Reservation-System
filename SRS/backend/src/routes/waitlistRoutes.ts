import { Router } from "express";

const router = Router();

// Join the waitlist
router.post("/", (req, res) => {
    res.json({
        message: "Join waitlist",
    });
});

// Get the waitlist
router.get("/", (req, res) => {
    res.json({
        message: "Get waitlist",
    });
});

export default router;