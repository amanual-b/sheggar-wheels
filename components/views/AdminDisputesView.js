"use client";
import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { SelectField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useData, useMyDisputes } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";

export default function AdminDisputesView() {
  const { items, loading } = useMyDisputes();
  const { bookings, carById, userById, loading: dl } = useData();
  const [status, setStatus] = useState("");
  if (loading || dl) return <PageLoading label="Loading disputes…" />;
  const rows = items.filter((d) => !status || d.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="stack-lg">
      <PageHeader title="Disputes" subtitle="Open issues need a resolution note." />
      <div style={{ maxWidth: 260 }}>
        <SelectField label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </SelectField>
      </div>
      <DataTable
        caption="Disputes"
        rows={rows}
        getKey={(d) => d.id}
        empty={<EmptyState title="No disputes to review">Nothing matches this filter.</EmptyState>}
        columns={[
          { header: "Reason", cell: (d) => <b>{d.reason}</b> },
          { header: "Booking", cell: (d) => { const b = bookings.find((x) => x.id === d.bookingId); const c = b && carById.get(b.carId); return c ? `${c.make} ${c.model}` : d.bookingId; } },
          { header: "Opened by", cell: (d) => userById.get(d.openedBy)?.name || "Unknown" },
          { header: "Opened", cell: (d) => formatDateTime(d.createdAt) },
          { header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
          { header: "Open", cell: (d) => <Link className="btn btn-secondary btn-sm" href={`/admin/disputes/${d.id}`}>{d.status === "open" ? "Resolve" : "View"}<span className="sr-only"> dispute {d.id}</span></Link> },
        ]}
      />
    </div>
  );
}
