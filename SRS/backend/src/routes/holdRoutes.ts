import { Router } from "express";

const router = Router();

// Place a hold on a seat
router.post("/", (req, res) => {
    res.json({
        message: "Place hold",
    });
});

// Confirm a hold
router.post("/confirm", (req, res) => {
    res.json({
        message: "Confirm hold",
    });
});

// Release a hold
router.post("/release", (req, res) => {
    res.json({
        message: "Release hold",
    });
});

// Extend a hold
router.post("/extend", (req, res) => {
    res.json({
        message: "Extend hold",
    });
});

export default router;