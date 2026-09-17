// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { DomainError } from "../services/holdService";

// Express recognizes this as error-handling middleware specifically
// because it takes 4 parameters (err, req, res, next) — that's not
// a style choice, Express checks the function's arity to decide
// whether to treat it as a normal or error-handling middleware.
export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (err instanceof DomainError) {
        res.status(400).json({ rule: err.rule, message: err.message });
        return;
    }

    console.error("Unexpected error:", err);
    res.status(500).json({ rule: "INTERNAL_ERROR", message: "Something went wrong." });
}