"use client";
import useSWR from "swr";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";
import { EmptyState, ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useOwnerBookings } from "@/lib/hooks";
import { approveBooking, completeRental, declineBooking, getAllowedActions, startRental } from "@/lib/bookings";
import { getOwnerCar } from "@/lib/cars";
import { useSession } from "@/lib/hooks";

export default function OwnerCarBookingsView({ id }) {
  const { data: res } = useSWR(["sw", "ownerCar", id], () => getOwnerCar(id));
  const { items, loading } = useOwnerBookings();
  const { carById, userById, loading: dl } = useData();
  const { user } = useSession();
  const run = useAction();

  if (res === undefined || loading || dl || !user) return <PageLoading label="Loading bookings…" />;
  if (!res.ok) return <ErrorState title={res.error === "Not yours" ? "You can only view bookings for your own cars" : res.error} actionHref="/owner/cars" actionLabel="Back to my cars" />;

  const car = res.data;
  const rows = items.filter((b) => b.carId === car.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const act = (b, action) => {
    const fn = { approve: approveBooking, decline: declineBooking, start: startRental, complete: completeRental }[action];
    const msg = { approve: "Request approved.", decline: "Request declined and refunded.", start: "Rental started.", complete: "Car returned. Payment released and the renter can review." }[action];
    run(fn(b.id), msg);
  };
  const labels = { approve: "Approve", decline: "Decline", start: "Start rental", complete: "Mark returned" };

  return (
    <div className="stack-lg">
      <PageHeader title="Requests and bookings" subtitle={`${car.make} ${car.model} ${car.year}`} actions={<Link className="btn btn-secondary" href="/owner/cars">Back to my cars</Link>} />
      <BookingsTable
        caption={`Bookings for ${car.make} ${car.model}`}
        bookings={rows}
        carById={carById}
        userById={userById}
        parties
        empty={<EmptyState title="No bookings for this car yet">Requests appear here as soon as a renter books these dates.</EmptyState>}
        extra={(b) => {
          const actions = getAllowedActions(b, user).filter((a) => labels[a]);
          return actions.length || b.status === "in_progress" ? (
            <div className="btn-row">
              {b.status === "in_progress" ? <Link className="btn btn-secondary btn-sm" href={`/owner/bookings/${b.id}/track`}>Track trip<span className="sr-only"> booking {b.id}</span></Link> : null}
              {actions.map((a) => (
                <button key={a} type="button" className={`btn btn-sm ${a === "approve" || a === "start" || a === "complete" ? "btn-primary" : "btn-secondary"}`} onClick={() => act(b, a)}>
                  {labels[a]}<span className="sr-only"> booking {b.id}</span>
                </button>
              ))}
            </div>
          ) : <span className="muted small">No actions</span>;
        }}
      />
    </div>
  );
}
