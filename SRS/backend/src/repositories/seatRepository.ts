import { Seat, SeatStatus } from "../types";

// finding a seat by using its seat number and returning it if its found, returns all seats, update the status of a seat

export interface SeatRepository {
    getSeat(seatNumber: number): Seat | undefined;

    getAllSeats(): Seat[];

    updateSeatStatus(
        seatNumber: number,
        status: SeatStatus,
        holdId?: string
    ): void;
}
