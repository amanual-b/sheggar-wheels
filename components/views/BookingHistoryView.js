"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";
import Pagination from "@/components/Pagination";
import { SelectField, TextField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useToast } from "@/components/Toast";
import { useData, useRenterBookings } from "@/lib/hooks";
import { exportRenterBookingsCsv } from "@/lib/reports";
import { downloadCSV } from "@/lib/csv";
import { paginate } from "@/lib/catalogue";
import { BOOKING_STATUSES, HISTORY_PAGE_SIZE, STATUS_LABELS } from "@/lib/constants";

export default function BookingHistoryView() {
  const { items, loading } = useRenterBookings();
  const { carById, loading: dl } = useData();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((b) => (!status || b.status === status))
      .filter((b) => {
        if (!needle) return true;
        const c = carById.get(b.carId);
        return `${c?.make || ""} ${c?.model || ""} ${b.id}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [items, status, q, carById]);

  if (loading || dl) return <PageLoading label="Loading bookings…" />;
  const pg = paginate(filtered, page, HISTORY_PAGE_SIZE);

  const exportCsv = () => {
    const res = exportRenterBookingsCsv();
    if (!res.ok) return toast.error(res.error);
    downloadCSV(res.data.filename, res.data.csv);
    toast.success("Your booking history was exported.");
  };

  return (
    <div className="stack-lg">
      <PageHeader title="Booking history" subtitle="Every request and trip on your account." actions={<button type="button" className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>} />
      <div className="card card-body">
        <div className="form-grid">
          <TextField label="Search by car or booking id" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </SelectField>
        </div>
      </div>
      <BookingsTable
        caption="Your bookings"
        bookings={pg.items}
        carById={carById}
        hrefFor={(b) => `/bookings/${b.id}`}
        extra={(b) =>
          b.status === "completed" ? (
            <Link className="btn btn-primary btn-sm" href={`/bookings/${b.id}/review`}>Write review<span className="sr-only"> for booking {b.id}</span></Link>
          ) : b.status === "reviewed" ? (
            <span className="badge badge-success">Reviewed ✓</span>
          ) : (
            <span className="muted small">-</span>
          )
        }
        empty={<EmptyState title={items.length ? "No bookings match your filters" : "You have no bookings yet"} actionHref="/cars" actionLabel="Browse cars">{items.length ? "Try a different status or search." : "Request a car to start your history."}</EmptyState>}
      />
      <Pagination page={pg.page} totalPages={pg.totalPages} onChange={setPage} label="Booking history pages" />
    </div>
  );
}
