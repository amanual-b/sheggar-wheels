"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import BookingPanel from "@/components/BookingPanel";
import CarGallery from "@/components/CarGallery";
import CarMap from "@/components/CarMap";
import StatusBadge from "@/components/StatusBadge";
import { ErrorState, PageLoading } from "@/components/States";
import { useData, useMounted, useSession } from "@/lib/hooks";
import { getBlockedDates, isCarPubliclyBookable } from "@/lib/bookings";
import { averageRating } from "@/lib/reviews";
import { hasRole } from "@/lib/session";
import { formatDate, formatETB, pluralize } from "@/lib/format";
import { isValidISODate } from "@/lib/dates";

export default function CarDetailClient({ id }) {
  const { cars, users, bookings, reviews, userById, loading, fromSeed } = useData({ seeded: true });
  const { user } = useSession();
  const mounted = useMounted();
  const [range, setRange] = useState(null);
  const [initial, setInitial] = useState({ start: "", end: "" });

  // Read ?start=&end= after mount so this page can stay statically generated (no useSearchParams).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const start = p.get("start");
    const end = p.get("end");
    if (isValidISODate(start) && isValidISODate(end)) setInitial({ start, end });
  }, []);

  const car = cars.find((c) => c.id === id);
  const carReviews = useMemo(() => reviews.filter((r) => r.carId === id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviews, id]);
  const booked = useMemo(() => (car ? getBlockedDates(car, bookings) : new Set()), [car, bookings]);

  if (loading || (!car && fromSeed)) return <div className="container section"><PageLoading label="Loading car details…" /></div>;
  if (!car) {
    return (
      <div className="container section" style={{ maxWidth: 680 }}>
        <ErrorState title="Car not found" actionHref="/cars" actionLabel="Browse all cars">
          We couldn't find that listing. It may have been removed or the link is wrong.
        </ErrorState>
      </div>
    );
  }

  const isPublic = isCarPubliclyBookable(car, users);
  const canPreview = !!user && (car.ownerId === user.id || hasRole(user, "admin"));
  if (!isPublic && !canPreview) {
    return (
      <div className="container section" style={{ maxWidth: 680 }}>
        <ErrorState title="This listing is not available" actionHref="/cars" actionLabel="Browse all cars">
          It is not currently approved for public viewing.
        </ErrorState>
      </div>
    );
  }

  const owner = userById.get(car.ownerId);
  const avg = averageRating(carReviews);
  const initialStart = initial.start;
  const initialEnd = initial.end;
  const title = `${car.make} ${car.model} ${car.year}`;

  return (
    <div className="container section" style={{ paddingTop: "1.5rem" }}>
      <nav aria-label="Breadcrumb" className="small" style={{ marginBottom: 12 }}>
        <Link href="/cars">Cars</Link> / <span aria-current="page">{title}</span>
      </nav>
      {!isPublic ? (
        <div className="alert alert-warning" style={{ marginBottom: 16 }} role="status">
          <b>Preview only</b> This listing is <StatusBadge status={car.status} /> and is not shown to the public.
        </div>
      ) : null}
      <div className="detail-layout">
        <div className="stack-lg" style={{ minWidth: 0 }}>
          <CarGallery photos={car.photos} title={title} />
          <header>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="badge badge-purple">{car.fuel}</span>
              {avg ? <span className="rating">★ {avg} ({pluralize(carReviews.length, "review")})</span> : <span className="muted small">No reviews yet</span>}
            </div>
            <h1 style={{ marginBottom: 4 }}>{title}</h1>
            <p className="muted">📍 {car.neighbourhood}, {car.city} · Listed by {owner ? owner.name : "an owner"}</p>
          </header>

          <section aria-labelledby="specs">
            <h2 id="specs" className="sr-only">Specifications</h2>
            <div className="spec-grid">
              <div className="spec"><b>{car.transmission}</b><span>Transmission</span></div>
              <div className="spec"><b>{car.seats}</b><span>Seats</span></div>
              <div className="spec"><b>{car.fuel}</b><span>Fuel</span></div>
              <div className="spec"><b>{formatETB(car.pricePerDay)}</b><span>Per day</span></div>
            </div>
          </section>

          <section aria-labelledby="about">
            <h2 id="about">About this car</h2>
            <p>{car.description}</p>
          </section>

          <section aria-labelledby="avail">
            <h2 id="avail">Availability</h2>
            {mounted ? (
              <AvailabilityCalendar booked={booked} range={range || (initialStart && initialEnd ? { start: initialStart, end: initialEnd } : undefined)} />
            ) : (
              <div className="skeleton" style={{ height: 372, maxWidth: 380 }} aria-hidden="true" />
            )}
          </section>

          <section aria-labelledby="loc">
            <h2 id="loc">Pickup area</h2>
            <CarMap lat={car.latitude} lng={car.longitude} label={title} neighbourhood={car.neighbourhood} city={car.city} />
          </section>

          <section aria-labelledby="revs">
            <h2 id="revs">Reviews</h2>
            {carReviews.length === 0 ? <p className="muted">No reviews yet. Reviews appear after a completed trip.</p> : null}
            <div className="stack">
              {carReviews.map((r) => (
                <article key={r.id} className="card card-body">
                  <div className="row-between">
                    <b>{userById.get(r.renterId)?.name || "Renter"}</b>
                    <span className="rating" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <p style={{ margin: "6px 0" }}>{r.comment}</p>
                  <span className="muted small">{formatDate(r.createdAt.slice(0, 10))}</span>
                  {r.ownerReply ? <div className="msg" style={{ marginTop: 10 }}><b className="small">Owner reply</b><br />{r.ownerReply}</div> : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside aria-label="Booking">
          {mounted ? (
            <BookingPanel key={`${initialStart}-${initialEnd}`} car={car} bookings={bookings} users={users} user={user} initialStart={initialStart} initialEnd={initialEnd} onRange={setRange} />
          ) : (
            <div className="skeleton" style={{ height: 330 }} aria-hidden="true" />
          )}
        </aside>
      </div>
    </div>
  );
}
