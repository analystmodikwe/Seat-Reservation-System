import { useState } from "react";
import { SeatGrid } from "./components/SeatGrid";
import { WaitlistPanel } from "./components/WaitlistPanel";
import { HoldCard } from "./components/HoldCard";
import { EventLog } from "./components/EventLog";
import { api, ApiRequestError } from "./api/client";
import "./App.css";

type Tab = "seats" | "manage" | "log";

// Tabs, not routes — a router adds a dependency this small app
// doesn't need, and the three screens don't have distinct URLs
// worth bookmarking separately for this assessment's purposes.
export default function App() {
    const [tab, setTab] = useState<Tab>("seats");
    const [email, setEmail] = useState("");
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [placeError, setPlaceError] = useState<string | null>(null);

    async function handlePlaceHold(seatNumber: number) {
        setPlacing(true);
        setPlaceError(null);
        try {
            await api.placeHold(email, seatNumber);
        } catch (err) {
            setPlaceError(err instanceof ApiRequestError ? err.message : "Could not place hold.");
        } finally {
            setPlacing(false);
        }
    }

    return (
        <div className="app">
            <h1>Seat Reservation</h1>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button onClick={() => setTab("seats")}>Seat Map</button>
                <button onClick={() => setTab("manage")}>Manage Hold</button>
                <button onClick={() => setTab("log")}>Event Log</button>
            </div>

            {tab === "seats" && (
                <>
                    <SeatGrid
                        email={email}
                        onEmailChange={setEmail}
                        onPlaceHold={handlePlaceHold}
                        onJoinWaitlist={() => setShowWaitlist(true)}
                        placing={placing}
                        placeError={placeError}
                    />
                    {showWaitlist && (
                        <WaitlistPanel email={email} onJoined={() => setShowWaitlist(false)} />
                    )}
                </>
            )}

            {tab === "manage" && <HoldCard />}
            {tab === "log" && <EventLog />}
        </div>
    );
}