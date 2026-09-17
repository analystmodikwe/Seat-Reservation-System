import type { Seat } from "../api/types";

interface Props {
  seats: Seat[];
  mySeatNumbers: number[]; // seats held by this user, highlighted differently
  onSelect: (seatNumber: number) => void;
  busySeat: number | null; // seat with a request in flight
}

export function SeatGrid({ seats, mySeatNumbers, onSelect, busySeat }: Props) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => {
        const isMine = mySeatNumbers.includes(seat.number);
        const disabled = seat.status !== "available" || busySeat !== null;

        return (
          <button
            key={seat.number}
            type="button"
            // Classes drive the colour: available / held / confirmed / mine
            className={`seat seat--${seat.status}${isMine ? " seat--mine" : ""}`}
            disabled={disabled}
            onClick={() => onSelect(seat.number)}
            // Screen readers get the status, not just the number
            aria-label={`Seat ${seat.number}, ${seat.status}`}
          >
            {busySeat === seat.number ? "…" : seat.number}
          </button>
        );
      })}
    </div>
  );
}