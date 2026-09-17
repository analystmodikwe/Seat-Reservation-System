import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import type { WaitlistEntry } from "./api/types";
import { useSeats } from "./hooks/useSeats";
import { useMyHolds, useNow } from "./hooks/useMyHolds";
import { SeatGrid } from "./components/SeatGrid";
import { HoldCard } from "./components/HoldCard";
import { WaitlistPanel } from "./components/WaitlistPanel";
import "./App.css";

export default function App() {
  // Email is the only identity the backend has, so persist it.
  const [email, setEmail] = useState(() => localStorage.getItem("srs.email") ?? "");
  const [message, setMessage] = useState<{ text: string; kind: "error" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [busySeat, setBusySeat] = useState<number | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const { seats, loading, error, refresh } = useSeats();
  const { holds, upsert, remove, HOLD_WINDOW_MS } = useMyHolds();
  const now = useNow();

  useEffect(() => {
    localStorage.setItem("srs.email", email);
  }, [email]);

  // Central error handling: every action funnels through here so the
  // backend's `rule` gets surfaced consistently instead of each
  // handler writing its own try/catch boilerplate.
  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      setMessage(null);
      try {
        await action();
      } catch (err) {
        if (err instanceof ApiError) {
          setMessage({ text: err.message, kind: "error" });
        } else {
          setMessage({ text: "Something went wrong.", kind: "error" });
        }
      } finally {
        setBusy(false);
        setBusySeat(null);
        refresh(); // resync the grid whether we succeeded or failed
      }
    },
    [refresh],
  );

  const handleSelectSeat = (seatNumber: number) => {
    if (!email) {
      setMessage({ text: "Enter your email first.", kind: "error" });
      return;
    }
    setBusySeat(seatNumber);
    run(async () => {
      const res = await api.placeHold(email, seatNumber);
      upsert({ ...res, email, confirmed: false });
      setMessage({ text: `Seat ${res.seatNumber} held — code ${res.code}`, kind: "info" });
    });
  };

  const handleExtend = (code: string) =>
    run(async () => {
      const res = await api.extendHold(email, code);
      upsert({ ...res, email, confirmed: false });
    });

  const handleConfirm = (code: string) =>
    run(async () => {
      const res = await api.confirmHold(email, code);
      // The backend sends expiresAt: 0 on confirm, so don't trust it —
      // a confirmed hold never expires, so store null explicitly.
      upsert({ ...res, expiresAt: null, email, confirmed: true });
      setMessage({ text: `Seat ${res.seatNumber} confirmed.`, kind: "info" });
    });

  const handleRelease = (code: string) => {
    const hold = holds.find((h) => h.code === code);
    // An expired hold is already gone server-side; releasing it would
    // just 400. Drop it locally instead.
    if (hold && !hold.confirmed && hold.expiresAt && hold.expiresAt <= now) {
      remove(code);
      return;
    }
    run(async () => {
      await api.releaseHold(email, code);
      remove(code);
    });
  };

  const handleJoinWaitlist = () =>
    run(async () => {
      await api.joinWaitlist(email);
      setWaitlist(await api.getWaitlist());
      setMessage({ text: "You're on the waitlist.", kind: "info" });
    });

  // Poll the waitlist and the event log together.
  // The event log is the only way the frontend can discover a hold
  // code created by an auto-promotion — the service just logs it
  // server-side. Replace this with a GET /holds?email= endpoint later.
  useEffect(() => {
    if (!email) return;

    const check = async () => {
      try {
        const [list, events] = await Promise.all([api.getWaitlist(), api.getEvents()]);
        setWaitlist(list);

        for (const event of events) {
          if (event.type !== "waitlist_promoted") continue;
          if (event.email !== email || !event.holdCode) continue;
          if (holds.some((h) => h.code === event.holdCode)) continue; // already known

          upsert({
            code: event.holdCode,
            seatNumber: event.seatNumber!,
            email,
            expiresAt: event.timestamp + HOLD_WINDOW_MS, // estimated, see hook
            confirmed: false,
          });
          setMessage({
            text: `A seat opened up — seat ${event.seatNumber} is held for you.`,
            kind: "info",
          });
        }
      } catch {
        // Background poll: stay quiet, the next tick will retry
      }
    };

    check();
    const id = setInterval(check, 4000);
    return () => clearInterval(id);
  }, [email, holds, upsert, HOLD_WINDOW_MS]);

  const seatsAvailable = seats.some((s) => s.status === "available");
  const mySeatNumbers = holds.map((h) => h.seatNumber);

  return (
    <main className="app">
      <h1>Seat Reservation</h1>

      <label className="email-field">
        Your email
        <input
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value.trim())}
        />
      </label>

      {message && <p className={`banner banner--${message.kind}`}>{message.text}</p>}
      {error && <p className="banner banner--error">{error}</p>}

      <section className="panel">
        <h2>Seats</h2>
        {loading ? (
          <p>Loading seats…</p>
        ) : (
          <SeatGrid
            seats={seats}
            mySeatNumbers={mySeatNumbers}
            onSelect={handleSelectSeat}
            busySeat={busySeat}
          />
        )}
        <ul className="legend">
          <li><span className="swatch seat--available" /> Available</li>
          <li><span className="swatch seat--held" /> Held</li>
          <li><span className="swatch seat--confirmed" /> Confirmed</li>
        </ul>
      </section>

      {holds.length > 0 && (
        <section className="panel">
          <h2>Your holds</h2>
          {holds.map((hold) => (
            <HoldCard
              key={hold.code}
              hold={hold}
              now={now}
              busy={busy}
              onExtend={handleExtend}
              onConfirm={handleConfirm}
              onRelease={handleRelease}
            />
          ))}
        </section>
      )}

      <WaitlistPanel
        entries={waitlist}
        email={email}
        canJoin={!seatsAvailable && email !== ""}
        onJoin={handleJoinWaitlist}
        busy={busy}
      />
    </main>
  );
}