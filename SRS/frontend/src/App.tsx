import { useState } from "react";
import { SeatGrid } from "./components/SeatGrid";
import { WaitlistPanel } from "./components/WaitlistPanel";
import { HoldCard } from "./components/HoldCard";
import { EventLog } from "./components/EventLog";
import { api, ApiRequestError } from "./api/client";
import "./App.css";

type Tab = "seats" | "manage" | "log";

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

    const tabs: { id: Tab; label: string }[] = [
        { id: "seats", label: "Seat Map" },
        { id: "manage", label: "Manage Hold" },
        { id: "log", label: "Event Log" },
    ];

    return (
        <div className="app min-h-screen bg-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-semibold text-slate-800">
                    Seat Reservation
                </h1>

                <div className="mb-6 flex gap-2 border-b border-slate-200">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                tab === t.id
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === "seats" && (
                    <div className="space-y-4">
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
                    </div>
                )}

                {tab === "manage" && <HoldCard />}
                {tab === "log" && <EventLog />}
            </div>
        </div>
    );
}