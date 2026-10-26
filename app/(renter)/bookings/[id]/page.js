import { Suspense } from "react";
import BookingDetailView from "@/components/views/BookingDetailView";
import { PageLoading } from "@/components/States";

export const metadata = { title: "Booking details" };

export default async function BookingPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoading label="Loading booking…" />}>
      <BookingDetailView id={id} />
    </Suspense>
  );
}
