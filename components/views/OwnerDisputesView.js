"use client";
import DisputeThread from "@/components/DisputeThread";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useData, useMyDisputes, useSession } from "@/lib/hooks";
import { formatDateRange } from "@/lib/format";

export default function OwnerDisputesView() {
  const { user } = useSession();
  const { items, loading } = useMyDisputes();
  const { bookings, carById, userById, loading: dl } = useData();
  if (loading || dl || !user) return <PageLoading label="Loading disputes…" />;

  // Only disputes on bookings of this owner's cars (renter-side disputes live on the renter's booking page).
  const mine = items.filter((d) => bookings.find((b) => b.id === d.bookingId)?.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="stack-lg">
      <PageHeader title="Disputes" subtitle="Issues raised on rentals of your cars. An admin makes the final decision." />
      {mine.length === 0 ? (
        <EmptyState title="No disputes">Great news: nothing needs your attention.</EmptyState>
      ) : (
        <div className="stack">
          {mine.map((d) => {
            const b = bookings.find((x) => x.id === d.bookingId);
            const car = b && carById.get(b.carId);
            return (
              <article key={d.id} className="card card-body stack">
                <div className="muted small">{car ? `${car.make} ${car.model}` : "Car"} · {b ? formatDateRange(b.startDate, b.endDate) : ""} · renter {b ? userById.get(b.renterId)?.name : ""}</div>
                <DisputeThread dispute={d} userById={userById} currentUserId={user.id} canReply />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
