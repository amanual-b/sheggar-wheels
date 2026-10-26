import TrackTripView from "@/components/views/TrackTripView";

export const metadata = { title: "Track rental" };

export default async function OwnerTrackPage({ params }) {
  const { id } = await params;
  return <TrackTripView id={id} as="owner" />;
}
