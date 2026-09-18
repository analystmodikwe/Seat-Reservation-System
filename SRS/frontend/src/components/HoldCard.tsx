import { useState } from "react";
import { useMyHold } from "../hooks/useMyHolds";

export function HoldCard() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const { hold, error, loading, extendHold, confirmHold, releaseHold } = useMyHold();

    async function handleAction(action: (email: string, code: string) => Promise<unknown>) {
        try {
            await action(email, code);
        } catch {
            // error is already captured in the hook's `error` state
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="hold-email" className="mb-1 block text-sm font-medium text-slate-600">
                        Email
                    </label>
                    <input
                        id="hold-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="hold-code" className="mb-1 block text-sm font-medium text-slate-600">
                        Hold code
                    </label>
                    <input
                        id="hold-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={6}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => handleAction(extendHold)}
                    disabled={!email || !code || loading}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Extend
                </button>
                <button
                    onClick={() => handleAction(confirmHold)}
                    disabled={!email || !code || loading}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Confirm
                </button>
                <button
                    onClick={() => handleAction(releaseHold)}
                    disabled={!email || !code || loading}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Release
                </button>
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            {hold && (
                <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="font-medium">Seat {hold.seatNumber}</span> — code{" "}
                    <span className="font-mono">{hold.code}</span>
                    {hold.expiresAt !== null ? (
                        <> — expires at {new Date(hold.expiresAt).toLocaleTimeString()}</>
                    ) : (
                        <span className="text-emerald-600"> — confirmed, no expiry</span>
                    )}
                </div>
            )}
        </div>
    );
}