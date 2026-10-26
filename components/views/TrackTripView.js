"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CarMap from "@/components/CarMap";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useData, useTrackedBooking } from "@/lib/hooks";

// Predefined sample points (Bole -> Piassa). The marker only moves between these - it is NOT GPS.
const ROUTE = [
  [8.9959, 38.7852],
  [9.005, 38.779],
  [9.0166, 38.769],
  [9.028, 38.756],
  [9.0359, 38.7468],
];
const STEPS_PER_SEGMENT = 12;

function positionAt(step) {
  const seg = Math.min(ROUTE.length - 2, Math.floor(step / STEPS_PER_SEGMENT));
  const t = (step - seg * STEPS_PER_SEGMENT) / STEPS_PER_SEGMENT;
  const [a, b] = [ROUTE[seg], ROUTE[seg + 1]];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
const MAX_STEP = (ROUTE.length - 1) * STEPS_PER_SEGMENT;

export default function TrackTripView({ id, as = "renter" }) {
  const res = useTrackedBooking(id, as);
  const backHref = as === "owner" ? "/owner/cars" : `/bookings/${id}`;
  const backLabel = as === "owner" ? "Back to my cars" : "Back to booking";
  const { carById, loading } = useData();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= MAX_STEP) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 500);
    return () => clearInterval(timer.current);
  }, [playing]);

  const moving = useMemo(() => positionAt(step), [step]);

  if (res === undefined || loading) return <PageLoading label="Loading trip…" />;
  if (!res.ok) {
    return <ErrorState title={res.error === "Not yours" ? (as === "owner" ? "You can only track rentals of your own cars" : "You can't view this booking") : res.error} actionHref={as === "owner" ? "/owner/cars" : "/bookings"} actionLabel={as === "owner" ? "Back to my cars" : "Back to my bookings"} />;
  }
  const b = res.data;
  const car = carById.get(b.carId);
  if (b.status !== "in_progress") {
    return (
      <ErrorState title="Tracking is only available during a trip" actionHref={backHref} actionLabel={backLabel}>
        This booking is {b.status.replace("_", " ")}. The route preview appears once the rental has started.
      </ErrorState>
    );
  }
  const pct = Math.round((step / MAX_STEP) * 100);
  return (
    <div className="stack-lg">
      <PageHeader title="Trip tracker" subtitle={car ? `${car.make} ${car.model} · booking ${b.id}` : b.id} actions={<Link className="btn btn-secondary" href={backHref}>{backLabel}</Link>} />
      <div className="alert alert-info"><b>Route preview</b>The marker follows a sample route in Addis Ababa. Live GPS tracking is not available yet.</div>
      <CarMap lat={ROUTE[0][0]} lng={ROUTE[0][1]} label="Route start" neighbourhood="Sample route: Bole to Piassa" city="Addis Ababa" path={ROUTE} moving={moving} simulation />
      <div className="card card-body stack">
        <div className="row-between">
          <b>Route progress: {pct}%</b>
          <span className="badge badge-purple">Route preview</span>
        </div>
        <progress value={step} max={MAX_STEP} aria-label="Route progress" style={{ width: "100%", height: 14 }} />
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => { if (step >= MAX_STEP) setStep(0); setPlaying((p) => !p); }}>{playing ? "Pause" : step >= MAX_STEP ? "Replay" : "Start route preview"}</button>
          <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => Math.min(MAX_STEP, s + STEPS_PER_SEGMENT))} disabled={step >= MAX_STEP}>Next waypoint</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setPlaying(false); setStep(0); }}>Reset</button>
        </div>
      </div>
    </div>
  );
}
