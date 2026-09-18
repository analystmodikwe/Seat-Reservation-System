import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { EventLogEntry } from "../api/types";

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
                <label htmlFor="seat-filter" className="mb-1 block text-sm font-medium text-slate-600">
                    Filter by seat number
                </label>
                <input
                    id="seat-filter"
                    type="number"
                    value={seatFilter}
                    onChange={(e) => setSeatFilter(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {error && (
                <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-2 font-medium">Time</th>
                            <th className="px-4 py-2 font-medium">Event</th>
                            <th className="px-4 py-2 font-medium">Seat</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Code</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map((entry, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-2 text-slate-500">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="px-4 py-2">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{entry.seatNumber ?? "—"}</td>
                                <td className="px-4 py-2">{entry.email}</td>
                                <td className="px-4 py-2 font-mono text-xs">{entry.holdCode ?? "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entries.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No events yet.</p>
                )}
            </div>
        </div>
    );
}