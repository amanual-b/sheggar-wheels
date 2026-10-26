import OwnerAvailabilityView from "@/components/views/OwnerAvailabilityView";

export const metadata = { title: "Manage availability" };

export default async function AvailabilityPage({ params }) {
  const { id } = await params;
  return <OwnerAvailabilityView id={id} />;
}
