"use client";
import { PageHeader, PageLoading, StatCard } from "@/components/States";
import { useToast } from "@/components/Toast";
import { useAdminBookings, useData } from "@/lib/hooks";
import { adminMetrics } from "@/lib/metrics";
import { exportAdminReportCsv } from "@/lib/reports";
import { downloadCSV } from "@/lib/csv";
import { SERVICE_FEE_RATE } from "@/lib/pricing";
import { formatETB } from "@/lib/format";

const REPORTS = [
  { kind: "summary", title: "Platform summary", text: "Key totals and the platform fee." },
  { kind: "bookings", title: "All bookings", text: "Every booking with renter, owner, price and status." },
  { kind: "listings", title: "Listings", text: "All cars with status and average rating." },
  { kind: "users", title: "Users", text: "Accounts, roles and status." },
];

export default function AdminReportsView() {
  const { users, cars, loading } = useData();
  const { items: bookings, loading: bl } = useAdminBookings();
  const toast = useToast();
  if (loading || bl) return <PageLoading label="Loading reports…" />;
  const m = adminMetrics(users, cars, bookings);

  const download = (kind) => {
    const res = exportAdminReportCsv(kind);
    if (!res.ok) return toast.error(res.error);
    downloadCSV(res.data.filename, res.data.csv);
    toast.success(`${res.data.filename} downloaded.`);
  };

  return (
    <div className="stack-lg">
      <PageHeader title="Reports" subtitle="Export platform data as CSV." />
      <div className="stat-grid">
        <StatCard label="Gross booking value" value={formatETB(m.gross)} sub="Completed, reviewed or resolved" />
        <StatCard label="Platform commission" value={formatETB(m.platformFee)} sub={`${Math.round(SERVICE_FEE_RATE * 100)}% service fee`} />
        <StatCard label="Bookings" value={m.totalBookings} />
      </div>
      <div className="grid grid-2">
        {REPORTS.map((r) => (
          <section key={r.kind} className="card card-body stack">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{r.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{r.text}</p>
            <div><button type="button" className="btn btn-secondary" onClick={() => download(r.kind)}>Download CSV<span className="sr-only">: {r.title}</span></button></div>
          </section>
        ))}
      </div>
    </div>
  );
}
