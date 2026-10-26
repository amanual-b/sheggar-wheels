"use client";
import { useState } from "react";
import { TextAreaField } from "@/components/Form";
import { useAction } from "@/components/Toast";
import { submitReview } from "@/lib/reviews";

/** Star rating + comment for ONE booking. The data layer allows exactly one review per booking. */
export default function ReviewForm({ booking, carName, onDone, children }) {
  const run = useAction();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const result = submitReview({ bookingId: booking.id, rating, comment });
    if (!result.ok) return setError(result.error);
    setError("");
    run(result, "Thanks! Your review was published.");
    if (onDone) onDone(result.data);
  };

  return (
    <form className="stack" onSubmit={submit} noValidate aria-label={`Review ${carName || "this trip"}`}>
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      <fieldset>
        <legend>Your rating</legend>
        <div className="stars" role="radiogroup" aria-label="Rating from 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="star-opt">
              <input type="radio" name={`rating-${booking.id}`} value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">{n}★</span>
              <span className="sr-only">{n} {n === 1 ? "star" : "stars"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField label="Tell future renters about your trip" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} hint={`${comment.length}/600 characters. At least 10.`} />
      <div className="btn-row">
        <button type="submit" className="btn btn-primary">Publish review</button>
        {children}
      </div>
    </form>
  );
}
