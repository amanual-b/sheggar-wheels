"use client";
import { useState } from "react";
import { TextAreaField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useOwnerCars, useSession } from "@/lib/hooks";
import { replyToReview } from "@/lib/reviews";
import { formatDate } from "@/lib/format";

function ReplyForm({ review }) {
  const run = useAction();
  const [text, setText] = useState(review.ownerReply || "");
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const res = replyToReview(review.id, text);
        if (!res.ok) return setError(res.error);
        setError("");
        run(res, "Reply saved.");
      }}
    >
      <TextAreaField label={review.ownerReply ? "Edit your reply" : "Reply to this review"} value={text} onChange={(e) => setText(e.target.value)} error={error} maxLength={400} style={{ minHeight: 80 }} />
      <div><button type="submit" className="btn btn-secondary btn-sm">{review.ownerReply ? "Update reply" : "Post reply"}</button></div>
    </form>
  );
}

export default function OwnerReviewsView() {
  const { user } = useSession();
  const { reviews, carById, userById, loading } = useData();
  const { loading: cl } = useOwnerCars();
  if (loading || cl || !user) return <PageLoading label="Loading reviews…" />;
  const mine = reviews.filter((r) => r.ownerId === user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return (
    <div className="stack-lg">
      <PageHeader title="Reviews" subtitle="What renters said about your cars." />
      {mine.length === 0 ? (
        <EmptyState title="No reviews yet">Reviews show up after a renter completes a trip in one of your cars.</EmptyState>
      ) : (
        <div className="stack">
          {mine.map((r) => {
            const car = carById.get(r.carId);
            return (
              <article key={r.id} className="card card-body stack">
                <div className="row-between">
                  <div><b>{car ? `${car.make} ${car.model}` : "Car"}</b> <span className="muted small">by {userById.get(r.renterId)?.name || "Renter"} · {formatDate(r.createdAt.slice(0, 10))}</span></div>
                  <span className="rating" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p style={{ margin: 0 }}>{r.comment}</p>
                <ReplyForm review={r} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
