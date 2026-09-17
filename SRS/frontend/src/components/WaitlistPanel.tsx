import type { WaitlistEntry } from "../api/types";

interface Props {
  entries: WaitlistEntry[];
  email: string;
  canJoin: boolean; // false while any seat is still available
  onJoin: () => void;
  busy: boolean;
}

export function WaitlistPanel({ entries, email, canJoin, onJoin, busy }: Props) {
  const myPosition = entries.findIndex((e) => e.email === email);

  return (
    <section className="panel">
      <h2>Waitlist</h2>

      {myPosition >= 0 ? (
        <p>You're number {myPosition + 1} in the queue.</p>
      ) : (
        <>
          <button type="button" disabled={!canJoin || busy} onClick={onJoin}>
            Join waitlist
          </button>
          {/* Explain the disabled state — the backend rejects joining
              while seats are free, so don't let the user find out the hard way */}
          {!canJoin && <p className="hint">Seats are still available — place a hold instead.</p>}
        </>
      )}

      <ol className="waitlist">
        {entries.map((entry) => (
          <li key={entry.email} className={entry.email === email ? "is-me" : ""}>
            {entry.email}
          </li>
        ))}
      </ol>
    </section>
  );
}