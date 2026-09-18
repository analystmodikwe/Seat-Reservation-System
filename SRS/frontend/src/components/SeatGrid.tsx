import { useSeats } from "../hooks/useSeats";

interface SeatGridProps {
    email: string;
    onEmailChange: (email: string) => void;
    onPlaceHold: (seatNumber: number) => void;
    onJoinWaitlist: () => void;
    placing: boolean;
    placeError: string | null;
}

const statusStyles: Record<string, string> = {
    available: "bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50",
    held: "bg-amber-100 border-amber-300 text-amber-700 cursor-not-allowed",
    confirmed: "bg-emerald-100 border-emerald-300 text-emerald-700 cursor-not-allowed",
};

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <label htmlFor="seat-email" className="mb-1 block text-sm font-medium text-slate-600">
                    Email
                </label>
                <input
                    id="seat-email"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading seats…</p>}
            {loadError && (
                <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {loadError}
                </p>
            )}
            {placeError && (
                <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {placeError}
                </p>
            )}

            <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-slate-300 bg-white" /> Available
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" /> Held
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-100" /> Confirmed
                </span>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
                {seats.map((seat) => (
                    <button
                        key={seat.number}
                        disabled={seat.status !== "available" || !email || placing}
                        onClick={() => onPlaceHold(seat.number)}
                        title={`Seat ${seat.number} — ${seat.status}`}
                        className={`aspect-square rounded-md border text-sm font-medium transition-colors disabled:opacity-80 ${statusStyles[seat.status]}`}
                    >
                        {seat.number}
                    </button>
                ))}
            </div>

            {!hasAvailableSeat && !loading && (
                <button
                    onClick={onJoinWaitlist}
                    disabled={!email}
                    className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Join waitlist
                </button>
            )}
        </div>
    );
}