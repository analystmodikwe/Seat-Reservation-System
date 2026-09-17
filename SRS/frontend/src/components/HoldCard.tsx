import type { StoredHold } from "../hooks/useMyHolds";

interface Props {
  hold: StoredHold;
  now: number;
  onExtend: (code: string) => void;
  onConfirm: (code: string) => void;
  onRelease: (code: string) => void;
  busy: boolean;
}

// Turn milliseconds into m:ss, clamped at zero so we never show "-1:59".
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function HoldCard({ hold, now, onExtend, onConfirm, onRelease, busy }: Props) {
  const remaining = hold.expiresAt ? hold.expiresAt - now : 0;
  const expired = !hold.confirmed && remaining <= 0;
  // Visual warning once under 15 seconds
  const urgent = !hold.confirmed && remaining > 0 && remaining < 15_000;

  return (
    <article className={`hold-card${urgent ? " hold-card--urgent" : ""}`}>
      <header>
        <strong>Seat {hold.seatNumber}</strong>
        <code>{hold.code}</code>
      </header>

      <p className="hold-status">
        {hold.confirmed
          ? "Confirmed — this seat is yours."
          : expired
            ? "Expired — the seat has been released."
            : `Expires in ${formatRemaining(remaining)}`}
      </p>

      <div className="hold-actions">
        {/* Extend and confirm are pointless once confirmed or expired,
            so they disappear rather than sitting there disabled. */}
        {!hold.confirmed && !expired && (
          <>
            <button type="button" disabled={busy} onClick={() => onExtend(hold.code)}>
              Extend
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => onConfirm(hold.code)}
            >
              Confirm
            </button>
          </>
        )}
        <button type="button" disabled={busy} onClick={() => onRelease(hold.code)}>
          {expired ? "Dismiss" : "Release"}
        </button>
      </div>
    </article>
  );
}