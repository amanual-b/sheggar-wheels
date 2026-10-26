"use client";
import DataTable from "@/components/DataTable";
import { BarChartCard } from "@/components/LazyCharts";
import { EmptyState, PageHeader, PageLoading, StatCard } from "@/components/States";
import { useToast } from "@/components/Toast";
import { useData, useOwnerBookings, useOwnerCars } from "@/lib/hooks";
import { ownerMetrics } from "@/lib/metrics";
import { exportOwnerBookingsCsv, exportOwnerEarningsCsv } from "@/lib/reports";
import { downloadCSV } from "@/lib/csv";
import { formatETB, formatMonth } from "@/lib/format";

export default function OwnerEarningsView() {
  const { items: cars, loading: cl } = useOwnerCars();
  const { items: bookings, loading: bl } = useOwnerBookings();
  const { loading } = useData();
  const toast = useToast();
  if (cl || bl || loading) return <PageLoading label="Loading earnings…" />;

  const m = ownerMetrics(cars, bookings);
  const rows = m.byMonth.map((x) => ({ ...x, label: formatMonth(x.month) }));
  const exportWith = (fn) => () => {
    const res = fn();
    if (!res.ok) return toast.error(res.error);
    downloadCSV(res.data.filename, res.data.csv);
    toast.success("Export ready.");
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="Earnings"
        subtitle="You earn the daily rate x days. The 10% service fee is paid by the renter."
        actions={<><button type="button" className="btn btn-secondary" onClick={exportWith(exportOwnerEarningsCsv)}>Export earnings CSV</button><button type="button" className="btn btn-secondary" onClick={exportWith(exportOwnerBookingsCsv)}>Export bookings CSV</button></>}
      />
      <div className="stat-grid">
        <StatCard label="Total earned" value={formatETB(m.totalEarnings)} />
        <StatCard label="Held (not yet released)" value={formatETB(m.heldEarnings)} />
        <StatCard label="Completed trips" value={m.perCar.reduce((s, r) => s + r.trips, 0)} />
      </div>
      <section className="card card-body" aria-labelledby="chart-t">
        <h2 id="chart-t" className="sr-only">Monthly earnings chart</h2>
        <BarChartCard title="Monthly earnings (ETB)" data={rows} xKey="label" yKey="earnings" format={(v) => formatETB(v).replace("ETB ", "")} summary={`Six months of earnings totalling ${formatETB(rows.reduce((s, r) => s + r.earnings, 0))}.`} />
      </section>
      <div className="stack-lg">
        <section aria-labelledby="mt">
          <h2 id="mt">Earnings by month</h2>
          <DataTable caption="Earnings by month" rows={rows} getKey={(r) => r.month} columns={[{ header: "Month", cell: (r) => r.label }, { header: "Earnings", numeric: true, cell: (r) => formatETB(r.earnings) }]} />
        </section>
        <section aria-labelledby="pc">
          <h2 id="pc">Per-car summary</h2>
          <DataTable
            caption="Earnings and utilization per car"
            rows={m.perCar}
            getKey={(r) => r.car.id}
            empty={<EmptyState title="No cars yet" actionHref="/owner/cars/new" actionLabel="Add a car" />}
            columns={[
              { header: "Car", cell: (r) => `${r.car.make} ${r.car.model}` },
              { header: "Trips", numeric: true, cell: (r) => r.trips },
              { header: "Used (30d)", numeric: true, cell: (r) => `${r.utilization}%` },
              { header: "Earned", numeric: true, cell: (r) => formatETB(r.earnings) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
