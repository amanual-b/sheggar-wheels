"use client";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";
import { BarChartCard } from "@/components/LazyCharts";
import DataTable from "@/components/DataTable";
import { EmptyState, PageHeader, PageLoading, StatCard } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useOwnerBookings, useOwnerCars } from "@/lib/hooks";
import { approveBooking, declineBooking } from "@/lib/bookings";
import { ownerMetrics } from "@/lib/metrics";
import { formatETB, formatMonth } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export default function OwnerOverviewView() {
  const { items: cars, loading: cl } = useOwnerCars();
  const { items: bookings, loading: bl } = useOwnerBookings();
  const { carById, userById, loading } = useData();
  const run = useAction();
  if (cl || bl || loading) return <PageLoading label="Loading your dashboard…" />;

  const m = ownerMetrics(cars, bookings);
  const pending = bookings.filter((b) => b.status === "requested");
  const chart = m.byMonth.map((x) => ({ month: formatMonth(x.month), earnings: x.earnings }));

  return (
    <div className="stack-lg">
      <PageHeader title="Owner dashboard" subtitle="Your cars, requests and earnings." actions={<Link className="btn btn-primary" href="/owner/cars/new">Add a car</Link>} />
      <div className="stat-grid">
        <StatCard label="Approved cars" value={m.approvedCars} sub={m.pendingCars ? `${m.pendingCars} awaiting review` : undefined} />
        <StatCard label="Pending requests" value={m.pendingRequests} tone="#d97706" />
        <StatCard label="Confirmed rentals" value={m.confirmedRentals} />
        <StatCard label="Total earnings" value={formatETB(m.totalEarnings)} sub="Completed trips" />
        <StatCard label="Held earnings" value={formatETB(m.heldEarnings)} sub="Confirmed, not yet released" />
      </div>

      <section aria-labelledby="req">
        <h2 id="req">Requests waiting for you</h2>
        <BookingsTable
          caption="Pending booking requests"
          bookings={pending}
          carById={carById}
          userById={userById}
          parties
          empty={<EmptyState title="No pending requests">New requests for your cars will appear here.</EmptyState>}
          extra={(b) => (
            <div className="btn-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => run(approveBooking(b.id), "Request approved. The booking is confirmed.")}>Approve<span className="sr-only"> {b.id}</span></button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(declineBooking(b.id), "Request declined and payment refunded.")}>Decline<span className="sr-only"> {b.id}</span></button>
            </div>
          )}
        />
      </section>

      <div className="stack-lg">
        <section className="card card-body" aria-labelledby="eg">
          <h2 id="eg" className="sr-only">Earnings by month</h2>
          <BarChartCard title="Earnings by month (ETB)" data={chart} xKey="month" yKey="earnings" format={(v) => formatETB(v).replace("ETB ", "")} summary={`Total earned over six months: ${formatETB(m.totalEarnings)}.`} />
        </section>
        <section aria-labelledby="util">
          <h2 id="util">Utilization per car</h2>
          <DataTable
            caption="Utilization per car over the last 30 days"
            rows={m.perCar}
            getKey={(r) => r.car.id}
            empty={<EmptyState title="You have no cars yet" actionHref="/owner/cars/new" actionLabel="Add your first car" />}
            columns={[
              { header: "Car", cell: (r) => `${r.car.make} ${r.car.model}` },
              { header: "Status", cell: (r) => <StatusBadge status={r.car.status} /> },
              { header: "Used (30d)", numeric: true, cell: (r) => `${r.utilization}%` },
              { header: "Earned", numeric: true, cell: (r) => formatETB(r.earnings) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
