
import { Router } from "express";
import { holdService, waitlistService } from "../container";

const router = Router();

router.post("/", (req, res, next) => {
    const { email, seatNumber } = req.body;
    holdService
        .placeHold({ email, seatNumber })
        .then((result) => res.status(201).json(result))
        .catch(next);
});

router.post("/extend", (req, res, next) => {
    const { email, code } = req.body;
    holdService
        .extendHold({ email, code })
        .then((result) => res.status(200).json(result))
        .catch(next);
});

router.post("/confirm", (req, res, next) => {
    const { email, code } = req.body;
    holdService
        .confirmHold({ email, code })
        .then((result) => res.status(200).json(result))
        .catch(next);
});

router.post("/release", (req, res, next) => {
    const { email, code } = req.body;
    holdService
        .releaseHold({ email, code })
        .then(async (freedSeatNumber) => {
            await waitlistService.promoteNext(freedSeatNumber);
            res.status(200).json({ message: "Hold released" });
        })
        .catch(next);
});

export default router;