"use client";
import { useMemo, useState } from "react";
import { addDays, todayISO } from "@/lib/dates";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Month calendar built from real buttons (keyboard + screen-reader friendly).
 * booked: Set of dates held by confirmed rentals (never editable)
 * blocked: Set of owner-blocked dates (toggle when editable)
 * range: { start, end } highlight for a chosen rental
 */
export default function AvailabilityCalendar({ booked = new Set(), blocked = new Set(), editable = false, onToggle, range }) {
  const today = todayISO();
  const [cursor, setCursor] = useState(today.slice(0, 7)); // YYYY-MM

  const cells = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);
    const first = `${cursor}-01`;
    const dow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const list = [];
    for (let i = 0; i < dow; i++) list.push(null);
    for (let d = 0; d < daysInMonth; d++) list.push(addDays(first, d));
    return list;
  }, [cursor]);

  const shift = (delta) => {
    const [y, m] = cursor.split("-").map(Number);
    const idx = y * 12 + (m - 1) + delta;
    const next = `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
    if (next >= today.slice(0, 7)) setCursor(next);
  };
  const [cy, cm] = cursor.split("-").map(Number);

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shift(-1)} disabled={cursor <= today.slice(0, 7)} aria-label="Previous month">‹</button>
        <b aria-live="polite">{MONTH_NAMES[cm - 1]} {cy}</b>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid" role="group" aria-label={`${MONTH_NAMES[cm - 1]} ${cy} availability`}>
        {DOW.map((d) => (
          <div key={d} className="cal-dow" aria-hidden="true">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="cal-day is-empty" aria-hidden="true" />;
          const past = date < today;
          const isBooked = booked.has(date);
          const isBlocked = blocked.has(date);
          const inRange = range && range.start && range.end && date >= range.start && date <= range.end;
          const cls = ["cal-day", past && "is-past", isBooked && "is-booked", isBlocked && "is-blocked", inRange && "is-range", date === today && "is-today"].filter(Boolean).join(" ");
          const state = past ? "past" : isBooked ? "booked" : isBlocked ? "blocked by owner" : "available";
          const label = `${Number(date.slice(8))} ${MONTH_NAMES[cm - 1]}, ${state}`;
          if (!editable) {
            // Read-only view: plain cells, state announced to screen readers.
            return (
              <div key={date} className={cls}>
                <span aria-hidden="true">{Number(date.slice(8))}</span>
                <span className="sr-only">{label}</span>
              </div>
            );
          }
          const toggleable = !past && !isBooked;
          return (
            <button
              key={date}
              type="button"
              className={cls}
              disabled={!toggleable}
              aria-pressed={isBlocked}
              aria-label={label}
              onClick={() => onToggle && onToggle(date)}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="legend" aria-hidden="true">
        <span><i style={{ background: "#fff", border: "1px solid #cfc8e6" }} />Available</span>
        <span><i style={{ background: "#fee2e2" }} />Blocked by owner</span>
        <span><i style={{ background: "#fef3c7" }} />Booked</span>
        {range ? <span><i style={{ background: "var(--p-100)" }} />Your dates</span> : null}
      </div>
    </div>
  );
}
