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
        <div className="panel">
            <div className="email-field">
                <label htmlFor="hold-email">Email</label>
                <input
                    id="hold-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            <div className="email-field">
                <label htmlFor="hold-code">Hold code</label>
                <input
                    id="hold-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                    onClick={() => handleAction(extendHold)}
                    disabled={!email || !code || loading}
                >
                    Extend
                </button>
                <button
                    onClick={() => handleAction(confirmHold)}
                    disabled={!email || !code || loading}
                >
                    Confirm
                </button>
                <button
                    onClick={() => handleAction(releaseHold)}
                    disabled={!email || !code || loading}
                >
                    Release
                </button>
            </div>

            {error && <p role="alert">{error}</p>}

            {hold && (
                <p>
                    Seat {hold.seatNumber} — code {hold.code}
                    {hold.expiresAt !== null
                        ? ` — expires at ${new Date(hold.expiresAt).toLocaleTimeString()}`
                        : " — confirmed, no expiry"}
                </p>
            )}
        </div>
    );
}