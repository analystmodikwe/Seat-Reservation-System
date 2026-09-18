import { useSeats } from "../hooks/useSeats";
import { Seat } from "../api/types";

interface SeatGridProps {
    email: string;
    onEmailChange: (email: string) => void;
    onPlaceHold: (seatNumber: number) => void;
    onJoinWaitlist: () => void;
    placing: boolean;
    placeError: string | null;
}

export function SeatGrid({
    email,
    onEmailChange,
    onPlaceHold,
    onJoinWaitlist,
    placing,
    placeError,
}: SeatGridProps) {
    const { seats, error: loadError, loading } = useSeats();

    const hasAvailableSeat = seats.some((seat) => seat.status === "available");

    return (
        <div className="panel">
            <div className="email-field">
                <label htmlFor="seat-email">Email</label>
                <input
                    id="seat-email"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            {loading && <p>Loading seats…</p>}
            {loadError && <p role="alert">{loadError}</p>}
            {placeError && <p role="alert">{placeError}</p>}

            <div className="seat-grid">
                {seats.map((seat) => (
                    <button
                        key={seat.number}
                        disabled={seat.status !== "available" || !email || placing}
                        onClick={() => onPlaceHold(seat.number)}
                        title={`Seat ${seat.number} — ${seat.status}`}
                    >
                        {seat.number}
                    </button>
                ))}
            </div>

            {!hasAvailableSeat && !loading && (
                <button onClick={onJoinWaitlist} disabled={!email}>
                    Join waitlist
                </button>
            )}
        </div>
    );
}