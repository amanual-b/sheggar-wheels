"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData } from "@/lib/hooks";
import { getOwnerCar, setUnavailableDates } from "@/lib/cars";
import { getBlockedDates } from "@/lib/bookings";
import { formatDate } from "@/lib/format";

export default function OwnerAvailabilityView({ id }) {
  const { data: res } = useSWR(["sw", "ownerCar", id], () => getOwnerCar(id));
  const { bookings, loading } = useData();
  const run = useAction();
  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    if (res && res.ok) setBlocked(new Set(res.data.unavailableDates));
  }, [res]);

  const bookedOnly = useMemo(() => {
    if (!res || !res.ok) return new Set();
    const all = getBlockedDates({ ...res.data, unavailableDates: [] }, bookings);
    return all;
  }, [res, bookings]);

  if (res === undefined || loading || (res.ok && blocked === null)) return <PageLoading label="Loading availability…" />;
  if (!res.ok) return <ErrorState title={res.error === "Not yours" ? "You can only manage your own cars" : res.error} actionHref="/owner/cars" actionLabel="Back to my cars" />;

  const car = res.data;
  const toggle = (date) =>
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  const dirty = JSON.stringify([...blocked].sort()) !== JSON.stringify([...car.unavailableDates].sort());
  const list = [...blocked].sort();

  return (
    <div className="stack-lg">
      <PageHeader title="Availability" subtitle={`${car.make} ${car.model} ${car.year}`} actions={<Link className="btn btn-secondary" href="/owner/cars">Back to my cars</Link>} />
      <div className="grid grid-2">
        <section aria-labelledby="cal-t">
          <h2 id="cal-t" style={{ fontSize: "1.1rem" }}>Click a day to block or unblock it</h2>
          <AvailabilityCalendar booked={bookedOnly} blocked={blocked} editable onToggle={toggle} />
          <p className="hint">Amber days are held by confirmed rentals and cannot be changed here.</p>
        </section>
        <section className="card card-body stack" aria-labelledby="blk">
          <h2 id="blk" style={{ fontSize: "1.1rem" }}>Blocked dates ({list.length})</h2>
          {list.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{list.map((d) => <li key={d}>{formatDate(d)}</li>)}</ul> : <p className="muted">No blocked dates. Renters can book any free day.</p>}
          <div className="btn-row">
            <button type="button" className="btn btn-primary" disabled={!dirty} onClick={() => run(setUnavailableDates(car.id, list), "Availability saved.")}>Save availability</button>
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setBlocked(new Set(car.unavailableDates))}>Undo changes</button>
          </div>
        </section>
      </div>
    </div>
  );
}
