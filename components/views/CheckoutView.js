"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useSession } from "@/lib/hooks";
import { KEYS, readStorage, removeStorage } from "@/lib/storage";
import { createBookingRequest, findConflict, isCarPubliclyBookable, rentalDays, validateDates } from "@/lib/bookings";
import { computePricing } from "@/lib/pricing";
import { formatDateRange, formatETB } from "@/lib/format";

export default function CheckoutView() {
  const router = useRouter();
  const run = useAction();
  const { user } = useSession();
  const { cars, users, bookings, loading } = useData();
  const [draft, setDraft] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Temporary checkout state lives in sessionStorage for this tab only.
    setDraft(readStorage(KEYS.checkoutDraft, null, { session: true, validate: (v) => v && typeof v.carId === "string" }));
  }, []);

  if (loading || draft === undefined || !user) return <PageLoading label="Preparing checkout…" />;

  const empty = (
    <ErrorState title="Nothing to check out" actionHref="/cars" actionLabel="Browse cars">
      Pick a car and your dates first. Your checkout summary is kept only for this browser tab.
    </ErrorState>
  );
  if (!draft) return empty;

  const car = cars.find((c) => c.id === draft.carId);
  if (!car || !isCarPubliclyBookable(car, users)) {
    return <ErrorState title="That car is no longer available" actionHref="/cars" actionLabel="Browse cars">The listing may have been deactivated or removed.</ErrorState>;
  }
  const problem = validateDates(draft.startDate, draft.endDate) || findConflict(car, bookings, draft.startDate, draft.endDate);
  if (problem) {
    return (
      <ErrorState title="These dates can no longer be booked" actionHref={`/cars/${car.id}`} actionLabel="Choose new dates">
        {problem}
      </ErrorState>
    );
  }
  const pricing = computePricing(car.pricePerDay, rentalDays(draft.startDate, draft.endDate));

  const pay = () => {
    setBusy(true);
    setError("");
    const res = createBookingRequest({ carId: car.id, startDate: draft.startDate, endDate: draft.endDate });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    removeStorage(KEYS.checkoutDraft, { session: true });
    run(res, "Payment complete. Your request was sent to the owner.");
    router.push(`/bookings/${res.data.id}?new=1`);
  };

  return (
    <div className="stack-lg" style={{ maxWidth: 820 }}>
      <PageHeader title="Review and pay" subtitle="Check your trip, then pay with TeleBirr. Your payment is held until the owner approves." />
      <div className="alert alert-info"><b>Payment note</b>Payments are simulated in this version: no money moves and no phone number, PIN or card details are collected.</div>
      {error ? <div className="alert alert-error" role="alert"><b>Could not complete checkout</b>{error}</div> : null}
      <div className="grid grid-2">
        <section className="card" aria-labelledby="trip">
          <div className="car-media" style={{ borderRadius: "14px 14px 0 0" }}><SmartImage src={car.photos[0]} alt={`${car.make} ${car.model}`} sizes="400px" /></div>
          <div className="card-body">
            <h2 id="trip" style={{ fontSize: "1.2rem" }}>{car.make} {car.model} {car.year}</h2>
            <dl className="kv">
              <dt>Dates</dt><dd>{formatDateRange(draft.startDate, draft.endDate)}</dd>
              <dt>Pickup</dt><dd>{car.neighbourhood}, {car.city}</dd>
              <dt>Renter</dt><dd>{user.name}</dd>
            </dl>
          </div>
        </section>
        <section className="card card-body stack" aria-labelledby="pay-title">
          <h2 id="pay-title" style={{ fontSize: "1.2rem" }}>Price summary</h2>
          <div className="price-lines">
            <div><span>{formatETB(pricing.pricePerDay)} × {pricing.days} {pricing.days === 1 ? "day" : "days"}</span><span>{formatETB(pricing.subtotal)}</span></div>
            <div><span>Service fee (10%)</span><span>{formatETB(pricing.fee)}</span></div>
            <div className="total"><span>Total</span><span>{formatETB(pricing.total)}</span></div>
          </div>
          <div className="msg"><b>Payment method:</b> TeleBirr. Funds stay <i>held</i> until the trip is completed.</div>
          <button type="button" className="btn btn-primary btn-block" onClick={pay} disabled={busy}>{busy ? "Processing…" : "Confirm and pay"}</button>
          <Link className="btn btn-ghost btn-block" href={`/cars/${car.id}`}>Change dates</Link>
        </section>
      </div>
    </div>
  );
}
