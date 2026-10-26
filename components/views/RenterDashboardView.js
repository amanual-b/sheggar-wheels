"use client";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";
import { EmptyState, PageHeader, PageLoading, StatCard } from "@/components/States";
import { useData, useRenterBookings, useSession } from "@/lib/hooks";
import { renterMetrics } from "@/lib/metrics";
import { formatDateRange, formatETB } from "@/lib/format";
import { hasRole } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";

export default function RenterDashboardView() {
  const { user } = useSession();
  const { items: bookings, loading } = useRenterBookings();
  const { carById, loading: dataLoading } = useData();
  if (loading || dataLoading || !user) return <PageLoading label="Loading your trips…" />;

  const m = renterMetrics(bookings);
  const sorted = [...bookings].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const live = sorted.filter((b) => ["requested", "confirmed", "in_progress", "disputed"].includes(b.status));
  const past = sorted.filter((b) => !["requested", "confirmed", "in_progress", "disputed"].includes(b.status)).slice(0, 5);
  const nextCar = m.next ? carById.get(m.next.carId) : null;

  return (
    <div className="stack-lg">
      <PageHeader title={`Hello, ${user.name.split(" ")[0]}`} subtitle="Your trips, requests and spending at a glance." actions={<Link className="btn btn-primary" href="/cars">Find a car</Link>} />

      <div className="stat-grid">
        <StatCard label="Upcoming trips" value={m.upcoming} sub="Requested or confirmed" />
        <StatCard label="In progress" value={m.inProgress} />
        <StatCard label="Completed trips" value={m.completed} />
        <StatCard label="Cancelled / declined" value={m.cancelled} />
        <StatCard label="Total spend" value={formatETB(m.totalSpend)} sub="Completed trips only" />
      </div>

      <section aria-labelledby="next-trip">
        <h2 id="next-trip">Next booking</h2>
        {m.next ? (
          <div className="card card-body row-between">
            <div>
              <b>{nextCar ? `${nextCar.make} ${nextCar.model}` : "Car"}</b> <StatusBadge status={m.next.status} />
              <div className="muted">{formatDateRange(m.next.startDate, m.next.endDate)} · {formatETB(m.next.total)}</div>
            </div>
            <Link className="btn btn-secondary" href={`/bookings/${m.next.id}`}>View booking</Link>
          </div>
        ) : (
          <EmptyState title="No upcoming trips" actionHref="/cars" actionLabel="Browse cars">When you request a car, it shows up here.</EmptyState>
        )}
      </section>

      <section aria-labelledby="active">
        <h2 id="active">Active and upcoming</h2>
        <BookingsTable caption="Active and upcoming bookings" bookings={live} carById={carById} hrefFor={(b) => `/bookings/${b.id}`} empty={<EmptyState title="You have no bookings yet" actionHref="/cars" actionLabel="Browse cars">Find a car and request your first trip.</EmptyState>} />
      </section>

      {past.length ? (
        <section aria-labelledby="past">
          <div className="row-between"><h2 id="past">Recent history</h2><Link href="/bookings">View all bookings</Link></div>
          <BookingsTable
            caption="Recent past bookings"
            bookings={past}
            carById={carById}
            hrefFor={(b) => `/bookings/${b.id}`}
            extra={(b) => (b.status === "completed" ? <Link className="btn btn-primary btn-sm" href={`/bookings/${b.id}/review`}>Write review<span className="sr-only"> for booking {b.id}</span></Link> : b.status === "reviewed" ? <span className="badge badge-success">Reviewed ✓</span> : <span className="muted small">-</span>)}
          />
        </section>
      ) : null}

      {!hasRole(user, "owner") ? (
        <div className="cta-band">
          <div><h2>Own a car?</h2><p>Enable owner tools on this same account and publish a listing for review.</p></div>
          <Link className="btn btn-light" href="/owner">Set up owner tools</Link>
        </div>
      ) : null}
    </div>
  );
}
