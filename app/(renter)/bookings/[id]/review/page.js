import ReviewFormView from "@/components/views/ReviewFormView";

export const metadata = { title: "Review your trip" };

export default async function ReviewPage({ params }) {
  const { id } = await params;
  return <ReviewFormView id={id} />;
}
