import { useState, useEffect } from "react";
import { api } from "../api/client";
import { EventLogEntry } from "../api/types";

export function EventLog() {
    const [entries, setEntries] = useState<EventLogEntry[]>([]);
    const [seatFilter, setSeatFilter] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const seatNumber = seatFilter ? Number(seatFilter) : undefined;

        if (seatFilter && Number.isNaN(seatNumber)) {
            return;
        }

        api
            .getEventLog(seatNumber)
            .then(setEntries)
            .catch(() => setError("Could not load event log."));
    }, [seatFilter]);

    return (
        <div className="panel">
            <div className="email-field">
                <label htmlFor="seat-filter">Filter by seat number</label>
                <input
                    id="seat-filter"
                    type="number"
                    value={seatFilter}
                    onChange={(e) => setSeatFilter(e.target.value)}
                    placeholder="e.g. 5"
                />
            </div>

            {error && <p role="alert">{error}</p>}

            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Seat</th>
                        <th>Email</th>
                        <th>Code</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, i) => (
                        <tr key={i}>
                            <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                            <td>{entry.type}</td>
                            <td>{entry.seatNumber ?? "—"}</td>
                            <td>{entry.email}</td>
                            <td>{entry.holdCode ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}