"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import DisputeThread from "@/components/DisputeThread";
import StatusBadge from "@/components/StatusBadge";
import { TextAreaField } from "@/components/Form";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData } from "@/lib/hooks";
import { getDisputeForUser, resolveDispute } from "@/lib/disputes";
import { formatDateRange, formatETB } from "@/lib/format";

export default function AdminDisputeDetailView({ id }) {
  const { data: res } = useSWR(["sw", "dispute", id], () => getDisputeForUser(id));
  const { bookings, carById, userById, loading } = useData();
  const run = useAction();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  if (res === undefined || loading) return <PageLoading label="Loading dispute…" />;
  if (!res.ok) return <ErrorState title={res.error} actionHref="/admin/disputes" actionLabel="Back to disputes" />;

  const d = res.data;
  const b = bookings.find((x) => x.id === d.bookingId);
  const car = b && carById.get(b.carId);

  return (
    <div className="stack-lg">
      <PageHeader title="Dispute" subtitle={`Booking ${d.bookingId}`} actions={<Link className="btn btn-secondary" href="/admin/disputes">All disputes</Link>} />
      <div className="grid grid-2">
        <section className="card card-body stack" aria-labelledby="bk">
          <h2 id="bk" style={{ fontSize: "1.1rem" }}>Booking</h2>
          {b ? (
            <dl className="kv">
              <dt>Car</dt><dd>{car ? `${car.make} ${car.model} ${car.year}` : "Unknown"}</dd>
              <dt>Dates</dt><dd>{formatDateRange(b.startDate, b.endDate)}</dd>
              <dt>Renter</dt><dd>{userById.get(b.renterId)?.name}</dd>
              <dt>Owner</dt><dd>{userById.get(b.ownerId)?.name}</dd>
              <dt>Total</dt><dd>{formatETB(b.total)}</dd>
              <dt>Status</dt><dd><StatusBadge status={b.status} /></dd>
              <dt>Payment</dt><dd><StatusBadge status={b.paymentStatus} /></dd>
            </dl>
          ) : <p className="muted">Booking record missing.</p>}
        </section>
        <section className="card card-body" aria-labelledby="th">
          <h2 id="th" className="sr-only">Dispute details</h2>
          <DisputeThread dispute={d} userById={userById} currentUserId="" />
        </section>
      </div>
      {d.status === "open" ? (
        <form
          className="card card-body stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const result = resolveDispute(d.id, notes);
            if (!result.ok) return setError(result.error);
            setError("");
            run(result, "Dispute resolved and notes recorded.");
          }}
        >
          <h2 style={{ fontSize: "1.1rem" }}>Resolve this dispute</h2>
          <TextAreaField label="Resolution notes" value={notes} onChange={(e) => setNotes(e.target.value)} error={error} maxLength={800} hint="Explain the outcome. Both parties can read this. At least 10 characters." />
          <div><button type="submit" className="btn btn-primary">Resolve dispute</button></div>
        </form>
      ) : null}
    </div>
  );
}
