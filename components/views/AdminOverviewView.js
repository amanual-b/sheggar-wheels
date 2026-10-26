"use client";
import Link from "next/link";
import { BarChartCard, LineChartCard } from "@/components/LazyCharts";
import DataTable from "@/components/DataTable";
import { PageHeader, PageLoading, StatCard } from "@/components/States";
import { useAdminBookings, useData } from "@/lib/hooks";
import { adminMetrics } from "@/lib/metrics";
import { STATUS_LABELS } from "@/lib/constants";
import { formatETB, formatMonth } from "@/lib/format";

export default function AdminOverviewView() {
  const { users, cars, disputes, loading } = useData();
  const { items: bookings, loading: bl } = useAdminBookings();
  if (loading || bl) return <PageLoading label="Loading platform metrics…" />;

  const m = adminMetrics(users, cars, bookings);
  const byStatus = Object.entries(m.byStatus).map(([status, count]) => ({ status: STATUS_LABELS[status] || status, count }));
  const volume = m.volume.map((v) => ({ month: formatMonth(v.month), bookings: v.bookings }));
  const openDisputes = disputes.filter((d) => d.status === "open").length;

  return (
    <div className="stack-lg">
      <PageHeader title="Platform overview" subtitle="Moderation queue, activity and the platform fee." />
      <div className="stat-grid">
        <StatCard label="Total users" value={m.totalUsers} sub={`${m.activeUsers} active · ${m.suspendedUsers} suspended`} />
        <StatCard label="Approved cars" value={m.approvedCars} sub={<Link href="/admin/listings">{m.pendingCars} pending review</Link>} />
        <StatCard label="Bookings" value={m.totalBookings} />
        <StatCard label="Open disputes" value={openDisputes} tone="#d97706" sub={<Link href="/admin/disputes">Review disputes</Link>} />
        <StatCard label="Platform fee" value={formatETB(m.platformFee)} sub={`of ${formatETB(m.gross)} completed value`} />
      </div>
      <div className="grid grid-2">
        <section className="card card-body" aria-labelledby="c1">
          <h2 id="c1" className="sr-only">Bookings by status</h2>
          <BarChartCard title="Bookings by status" data={byStatus} xKey="status" yKey="count" summary={byStatus.map((s) => `${s.status}: ${s.count}`).join(", ")} />
        </section>
        <section className="card card-body" aria-labelledby="c2">
          <h2 id="c2" className="sr-only">Monthly booking volume</h2>
          <LineChartCard title="Monthly booking volume" data={volume} xKey="month" yKey="bookings" summary={volume.map((v) => `${v.month}: ${v.bookings}`).join(", ")} />
        </section>
      </div>
      <section aria-labelledby="tbl">
        <h2 id="tbl">Monthly booking volume (table)</h2>
        <DataTable caption="Bookings per month" rows={volume} getKey={(r) => r.month} columns={[{ header: "Month", cell: (r) => r.month }, { header: "Bookings", numeric: true, cell: (r) => r.bookings }]} />
      </section>
    </div>
  );
}
