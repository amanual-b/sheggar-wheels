"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReviewForm from "@/components/ReviewForm";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useData, useRenterBooking } from "@/lib/hooks";

export default function ReviewFormView({ id }) {
  const res = useRenterBooking(id);
  const { carById, loading } = useData();
  const router = useRouter();

  if (res === undefined || loading) return <PageLoading label="Loading…" />;
  if (!res.ok) return <ErrorState title={res.error === "Not yours" ? "You can't review this booking" : res.error} actionHref="/bookings" actionLabel="Back to my bookings" />;
  const b = res.data;
  const car = carById.get(b.carId);

  if (b.status === "reviewed") {
    return <ErrorState title="You already reviewed this trip" actionHref={`/bookings/${b.id}`} actionLabel="Back to booking">One review is allowed per booking.</ErrorState>;
  }
  if (b.status !== "completed") {
    return <ErrorState title="This trip cannot be reviewed yet" actionHref={`/bookings/${b.id}`} actionLabel="Back to booking">Reviews open once the owner marks the car as returned.</ErrorState>;
  }
  const name = car ? `${car.make} ${car.model} ${car.year}` : "this trip";
  return (
    <div className="stack-lg" style={{ maxWidth: 640 }}>
      <PageHeader title="Review your trip" subtitle={car ? name : ""} />
      <div className="card card-body">
        <ReviewForm booking={b} carName={name} onDone={() => router.push(`/bookings/${b.id}`)}>
          <Link className="btn btn-ghost" href={`/bookings/${b.id}`}>Cancel</Link>
        </ReviewForm>
      </div>
    </div>
  );
}
