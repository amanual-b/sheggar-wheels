import TrackTripView from "@/components/views/TrackTripView";

export const metadata = { title: "Trip tracker" };

export default async function TrackPage({ params }) {
  const { id } = await params;
  return <TrackTripView id={id} />;
}
