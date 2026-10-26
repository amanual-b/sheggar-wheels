"use client";
import { useMemo, useState } from "react";
import BookingsTable from "@/components/BookingsTable";
import Pagination from "@/components/Pagination";
import { SelectField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useAdminBookings, useData } from "@/lib/hooks";
import { paginate } from "@/lib/catalogue";
import { BOOKING_STATUSES, HISTORY_PAGE_SIZE, STATUS_LABELS } from "@/lib/constants";

export default function AdminBookingsView() {
  const { items, loading } = useAdminBookings();
  const { carById, userById, loading: dl } = useData();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const rows = useMemo(() => items.filter((b) => !status || b.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items, status]);
  if (loading || dl) return <PageLoading label="Loading bookings…" />;
  const pg = paginate(rows, page, HISTORY_PAGE_SIZE);
  return (
    <div className="stack-lg">
      <PageHeader title="All bookings" subtitle={`${items.length} bookings across the platform.`} />
      <div style={{ maxWidth: 260 }}>
        <SelectField label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </SelectField>
      </div>
      <BookingsTable caption="All platform bookings" bookings={pg.items} carById={carById} userById={userById} parties empty={<EmptyState title="No bookings with that status" />} />
      <Pagination page={pg.page} totalPages={pg.totalPages} onChange={setPage} label="Booking pages" />
    </div>
  );
}
