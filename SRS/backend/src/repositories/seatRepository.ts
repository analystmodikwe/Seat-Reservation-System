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

    // finding a sit by number or undefined if it doesnt exist
    getSeat(seatNumber: number): Seat | undefined {
        return this.seats.get(seatNumber);
    }

    // Returns all the seats as an array.
    getAllSeats(): Seat[] {
        return [...this.seats.values()];
    }

     // Changes the status of a seat.
    updateSeatStatus(
        seatNumber: number,
        status: SeatStatus,
        holdId?: string
    ): void {

        const seat = this.seats.get(seatNumber);

        // Do nothing if the seat doesn't exist.
        if (!seat) {
            return;
        }

        // Update the seat's status.
        seat.status = status;

        // Update the hold ID if one was provided.
        seat.holdId = holdId;
    }



}