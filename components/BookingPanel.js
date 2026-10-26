"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/Form";
import { findConflict, validateDates, rentalDays, isCarPubliclyBookable } from "@/lib/bookings";
import { computePricing } from "@/lib/pricing";
import { formatETB } from "@/lib/format";
import { hasRole } from "@/lib/session";
import { KEYS, writeStorage } from "@/lib/storage";
import { todayISO } from "@/lib/dates";

export default function BookingPanel({ car, bookings, users, user, initialStart = "", initialEnd = "", onRange }) {
  const router = useRouter();
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [touched, setTouched] = useState(false);
  const today = todayISO();

  const bookable = isCarPubliclyBookable(car, users);
  const error = useMemo(() => {
    if (!start || !end) return touched ? "Choose both a start and an end date." : null;
    return validateDates(start, end) || findConflict(car, bookings, start, end);
  }, [start, end, car, bookings, touched]);
  const pricing = start && end && !error ? computePricing(car.pricePerDay, rentalDays(start, end)) : null;

  const update = (s, e) => {
    setStart(s);
    setEnd(e);
    onRange && onRange(s && e && !validateDates(s, e) ? { start: s, end: e } : null);
  };

  const submit = (ev) => {
    ev.preventDefault();
    setTouched(true);
    if (!start || !end || error) return;
    if (!user) {
      // Not signed in: go to sign-in and come back to this exact page with the dates preserved.
      const back = `/cars/${car.id}?start=${start}&end=${end}`;
      router.push(`/signin?next=${encodeURIComponent(back)}`);
      return;
    }
    const draft = { carId: car.id, startDate: start, endDate: end, createdAt: new Date().toISOString() };
    const saved = writeStorage(KEYS.checkoutDraft, draft, { session: true });
    if (!saved.ok) return;
    router.push("/checkout");
  };

  let blockedReason = null;
  if (!bookable) blockedReason = "This listing is not open for booking.";
  else if (user && user.status === "suspended") blockedReason = "Your account is suspended, so booking is disabled.";
  else if (user && !hasRole(user, "renter")) blockedReason = "Administrator accounts cannot book cars. Sign in as a renter.";
  else if (user && car.ownerId === user.id) blockedReason = "This is your own listing.";

  return (
    <form className="card panel-sticky" onSubmit={submit} noValidate aria-labelledby="book-title">
      <div className="card-body stack">
        <div>
          <h2 id="book-title" style={{ fontSize: "1.2rem", marginBottom: 2 }}>Book this car</h2>
          <span className="price">{formatETB(car.pricePerDay)} <small>/ day</small></span>
        </div>
        {blockedReason ? (
          <div className="alert alert-warning" role="status">{blockedReason}</div>
        ) : (
          <>
            <div className="form-grid">
              <TextField label="Start date" type="date" min={today} value={start} onChange={(e) => update(e.target.value, end && e.target.value > end ? e.target.value : end)} />
              <TextField label="End date" type="date" min={start || today} value={end} onChange={(e) => update(start, e.target.value)} />
            </div>
            {error ? <div className="error-text" role="alert">{error}</div> : null}
            {pricing ? (
              <div className="price-lines" aria-live="polite">
                <div><span>{formatETB(pricing.pricePerDay)} × {pricing.days} {pricing.days === 1 ? "day" : "days"}</span><span>{formatETB(pricing.subtotal)}</span></div>
                <div><span>Service fee (10%)</span><span>{formatETB(pricing.fee)}</span></div>
                <div className="total"><span>Total</span><span>{formatETB(pricing.total)}</span></div>
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary btn-block">{user ? "Continue to checkout" : "Sign in to book"}</button>
            <p className="hint" style={{ margin: 0 }}>You are only asked to pay at checkout, and the owner must approve your request.</p>
          </>
        )}
      </div>
    </form>
  );
}
