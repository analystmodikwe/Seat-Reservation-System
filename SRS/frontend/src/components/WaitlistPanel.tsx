import { useState, useEffect } from "react";
import { api, ApiRequestError } from "../api/client";
import { WaitlistEntry } from "../api/types";

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
        <div className="panel">
            <h3>Waitlist</h3>
            {error && <p role="alert">{error}</p>}
            <button onClick={handleJoin} disabled={!email || joining}>
                Join waitlist
            </button>
            <p>{entries.length} {entries.length === 1 ? "person" : "people"} waiting</p>
        </div>
    );
}