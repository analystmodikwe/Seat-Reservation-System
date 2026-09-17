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

// storing seats in memory using map
// creating seats when repository is creted
export class InMemorySeatRepository implements SeatRepository {

    private seats: Map<number, Seat> = new Map();

     constructor(numberOfSeats: number) {

        for (let i = 1; i <= numberOfSeats; i++) {

            this.seats.set(i, {
                number: i,
                status: "available",
            });
        }
    }

}