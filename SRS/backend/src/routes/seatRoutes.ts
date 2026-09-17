import { Router } from "express";

const router = Router();

// GET /seats
router.get("/", (req, res) => {
    res.json({
        message: "Get all seats",
    });
});

export default router;