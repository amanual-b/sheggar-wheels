import { getBookings, getReviews, saveReview } from "./data.js";
import { requireRole } from "./session.js";
import { moveBooking } from "./bookings.js";
import { newId } from "./ids.js";
import { nowISO } from "./dates.js";
import { fail, ok } from "./result.js";

/** Renter reviews a completed booking they own. One review per booking. */
export function submitReview({ bookingId, rating, comment } = {}) {
  const auth = requireRole("renter");
  if (!auth.ok) return auth;
  const user = auth.data;
  const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking) return fail("Booking not found.");
  if (booking.renterId !== user.id) return fail("Not yours");
  if (booking.status === "reviewed" || getReviews().some((r) => r.bookingId === booking.id)) return fail("You have already reviewed this trip.");
  if (booking.status !== "completed") return fail("Only completed trips can be reviewed.");

  const stars = Number(rating);
  const text = String(comment || "").trim();
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Choose a rating from 1 to 5 stars.");
  if (text.length < 10) return fail("Write at least 10 characters about your trip.");
  if (text.length > 600) return fail("Keep your review under 600 characters.");

  const review = {
    id: newId("rv"),
    bookingId: booking.id,
    carId: booking.carId,
    renterId: user.id,
    ownerId: booking.ownerId,
    rating: stars,
    comment: text,
    ownerReply: "",
    createdAt: nowISO(),
  };
  const saved = saveReview(review);
  if (!saved.ok) return fail(saved.error);
  const moved = moveBooking(booking, "reviewed", user.id);
  return moved.ok ? ok(review) : moved;
}

/** Owner replies to a review of one of their own cars. */
export function replyToReview(reviewId, reply) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const review = getReviews().find((r) => r.id === reviewId);
  if (!review) return fail("Review not found.");
  if (review.ownerId !== auth.data.id) return fail("Not yours");
  const text = String(reply || "").trim();
  if (text.length < 2) return fail("Write a short reply.");
  if (text.length > 400) return fail("Keep your reply under 400 characters.");
  const updated = { ...review, ownerReply: text };
  const saved = saveReview(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}

export function averageRating(reviews) {
  if (!reviews.length) return null;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}
