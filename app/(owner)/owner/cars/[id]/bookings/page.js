import OwnerCarBookingsView from "@/components/views/OwnerCarBookingsView";

export const metadata = { title: "Car bookings" };

export default async function CarBookingsPage({ params }) {
  const { id } = await params;
  return <OwnerCarBookingsView id={id} />;
}
