import { useState, useEffect } from "react";
import { api, ApiRequestError } from "../api/client";
import type { WaitlistEntry } from "../api/types";

interface WaitlistPanelProps {
    email: string;
    onJoined: () => void;
}

export function WaitlistPanel({ email, onJoined }: WaitlistPanelProps) {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        api.getWaitlist().then(setEntries).catch(() => {});
    }, []);

    async function handleJoin() {
        setJoining(true);
        setError(null);
        try {
            await api.joinWaitlist(email);
            onJoined();
        } catch (err) {
            setError(err instanceof ApiRequestError ? err.message : "Could not join waitlist.");
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Waitlist</h3>
            {error && (
                <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </p>
            )}
            <button
                onClick={handleJoin}
                disabled={!email || joining}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Join waitlist
            </button>
            <p className="mt-3 text-sm text-slate-500">
                {entries.length} {entries.length === 1 ? "person" : "people"} waiting
            </p>
        </div>
    );
}