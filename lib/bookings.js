// Booking domain: lifecycle state machine, validation and ownership checks.
// Every exported action re-checks session, role, ownership and current state before writing.
import { getBookings, getCars, getUsers, saveBooking } from "./data.js";
import { requireRole, hasRole, getCurrentSession } from "./session.js";
import { MAX_RENTAL_DAYS, STATUS_LABELS } from "./constants.js";
import { diffDays, eachDate, isValidISODate, nowISO, rangesOverlap, todayISO } from "./dates.js";
import { computePricing, makePaymentRef } from "./pricing.js";
import { newId } from "./ids.js";
import { fail, ok } from "./result.js";

/** Booking statuses that block a car's dates for everyone else. */
export const BLOCKING_STATUSES = ["confirmed", "in_progress"];

/** The finite set of valid transitions: status -> { action: nextStatus }. */
export const TRANSITIONS = {
  requested: { approve: "confirmed", decline: "declined", cancel: "cancelled" },
  confirmed: { start: "in_progress", cancel: "cancelled" },
  in_progress: { complete: "completed", raise_issue: "disputed" },
  completed: { review: "reviewed" },
  reviewed: {},
  declined: {},
  cancelled: {},
  disputed: { resolve: "resolved" },
  resolved: {},
};

/** Who may perform each action. */
export const ACTION_ACTOR = {
  approve: "owner",
  decline: "owner",
  start: "owner",
  complete: "owner",
  cancel: "renter",
  raise_issue: "party",
  review: "renter",
  resolve: "admin",
};

export const ACTION_LABELS = {
  approve: "Approve request",
  decline: "Decline request",
  cancel: "Cancel booking",
  start: "Start rental",
  complete: "Mark returned / complete",
  raise_issue: "Raise an issue",
  review: "Leave a review",
  resolve: "Resolve dispute",
};

export function isCarPubliclyBookable(car, users) {
  if (!car || car.status !== "approved") return false;
  const owner = users.find((u) => u.id === car.ownerId);
  return !!owner && owner.status !== "suspended";
}

/** Validate the dates of a new request. Returns an error string or null. */
export function validateDates(startDate, endDate, today = todayISO()) {
  if (!isValidISODate(startDate) || !isValidISODate(endDate)) return "Choose a valid start and end date.";
  if (endDate < startDate) return "The end date cannot be before the start date.";
  if (startDate < today) return "The start date cannot be in the past.";
  const days = diffDays(startDate, endDate) + 1;
  if (days > MAX_RENTAL_DAYS) return `Rentals are limited to ${MAX_RENTAL_DAYS} days.`;
  return null;
}

export function rentalDays(startDate, endDate) {
  return diffDays(startDate, endDate) + 1;
}

/** Returns an error string if the dates collide with owner-blocked dates or active bookings. */
export function findConflict(car, bookings, startDate, endDate, ignoreBookingId = null) {
  const blocked = (car.unavailableDates || []).some((d) => d >= startDate && d <= endDate);
  if (blocked) return "The owner has marked some of those dates as unavailable.";
  const clash = bookings.some(
    (b) =>
      b.carId === car.id &&
      b.id !== ignoreBookingId &&
      BLOCKING_STATUSES.includes(b.status) &&
      rangesOverlap(startDate, endDate, b.startDate, b.endDate)
  );
  return clash ? "Those dates overlap an existing confirmed booking for this car." : null;
}

/** All dates that cannot be booked (owner-blocked + confirmed/in-progress bookings). */
export function getBlockedDates(car, bookings) {
  const set = new Set(car.unavailableDates || []);
  for (const b of bookings) {
    if (b.carId === car.id && BLOCKING_STATUSES.includes(b.status)) {
      for (const d of eachDate(b.startDate, b.endDate)) set.add(d);
    }
  }
  return set;
}

/** Create a booking request after a successful mock checkout. */
export function createBookingRequest(input) {
  const auth = requireRole("renter");
  if (!auth.ok) return auth;
  const user = auth.data;
  const cars = getCars();
  const users = getUsers();
  const bookings = getBookings();

  const car = cars.find((c) => c.id === input?.carId);
  if (!car || !isCarPubliclyBookable(car, users)) return fail("This car is not available for booking.");
  if (car.ownerId === user.id) return fail("You cannot book your own car.");

  const { startDate, endDate } = input;
  const dateError = validateDates(startDate, endDate);
  if (dateError) return fail(dateError);
  const conflict = findConflict(car, bookings, startDate, endDate);
  if (conflict) return fail(conflict);
  const duplicate = bookings.some(
    (b) => b.renterId === user.id && b.carId === car.id && b.status === "requested" && rangesOverlap(startDate, endDate, b.startDate, b.endDate)
  );
  if (duplicate) return fail("You already have a pending request for those dates.");

  const days = rentalDays(startDate, endDate);
  const pricing = computePricing(car.pricePerDay, days); // snapshot of the agreed price
  const now = nowISO();
  const booking = {
    id: newId("bk"),
    carId: car.id,
    renterId: user.id,
    ownerId: car.ownerId,
    startDate,
    endDate,
    days,
    ...pricing,
    paymentStatus: "held",
    paymentMethod: "TeleBirr",
    paymentRef: makePaymentRef(),
    status: "requested",
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: "requested", at: now, by: user.id }],
  };
  const saved = saveBooking(booking);
  return saved.ok ? ok(booking) : fail(saved.error);
}

/** What can this user do to this booking right now? Used by the UI and mirrored by the actions. */
export function getAllowedActions(booking, user, today = todayISO()) {
  if (!booking || !user || user.status === "suspended") return [];
  const options = TRANSITIONS[booking.status] || {};
  return Object.keys(options).filter((action) => {
    const actor = ACTION_ACTOR[action];
    const isRenter = booking.renterId === user.id && hasRole(user, "renter");
    const isOwner = booking.ownerId === user.id && hasRole(user, "owner");
    if (actor === "renter" && !isRenter) return false;
    if (actor === "owner" && !isOwner) return false;
    if (actor === "party" && !isRenter && !isOwner) return false;
    if (actor === "admin" && !hasRole(user, "admin")) return false;
    if (action === "cancel" && booking.status === "confirmed" && today >= booking.startDate) return false;
    return true;
  });
}

/** Moves a booking to its next status and stamps history. Caller has already authorised. */
export function moveBooking(booking, nextStatus, byUserId, paymentStatus) {
  const now = nowISO();
  const updated = {
    ...booking,
    status: nextStatus,
    paymentStatus: paymentStatus || booking.paymentStatus,
    updatedAt: now,
    statusHistory: [...(booking.statusHistory || []), { status: nextStatus, at: now, by: byUserId }],
  };
  const saved = saveBooking(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}

function applyTransition(bookingId, action) {
  const session = getCurrentSession();
  if (!session) return fail("Not signed in");
  const user = session.user;
  if (user.status === "suspended") return fail("Account suspended");

  const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking) return fail("Booking not found.");

  // 1) Ownership first, so other people's records are never touched or described.
  const actor = ACTION_ACTOR[action];
  if (actor === "owner" && !(booking.ownerId === user.id && hasRole(user, "owner"))) return fail("Not yours");
  if (actor === "renter" && !(booking.renterId === user.id && hasRole(user, "renter"))) return fail("Not yours");

  // 2) Then the lifecycle: is this a valid next step from the current status?
  const next = TRANSITIONS[booking.status]?.[action];
  if (!next) return fail(`A ${STATUS_LABELS[booking.status] || booking.status} booking cannot be changed that way.`);

  // 3) Then action-specific business rules.
  if (action === "cancel" && booking.status === "confirmed" && todayISO() >= booking.startDate) {
    return fail("Too late to cancel: the rental start date has been reached.");
  }
  if (action === "approve") {
    const car = getCars().find((c) => c.id === booking.carId);
    if (!car) return fail("The car for this booking no longer exists.");
    const conflict = findConflict(car, getBookings(), booking.startDate, booking.endDate, booking.id);
    if (conflict) return fail(conflict);
  }

  const payment = action === "decline" || action === "cancel" ? "refunded" : action === "complete" ? "paid" : undefined;
  return moveBooking(booking, next, user.id, payment);
}

export const approveBooking = (id) => applyTransition(id, "approve");
export const declineBooking = (id) => applyTransition(id, "decline");
export const cancelBooking = (id) => applyTransition(id, "cancel");
export const startRental = (id) => applyTransition(id, "start");
export const completeRental = (id) => applyTransition(id, "complete");

/** Renter reads a booking: only their own. */
export function getBookingForRenter(bookingId) {
  const auth = requireRole("renter");
  if (!auth.ok) return auth;
  const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking) return fail("Booking not found.");
  if (booking.renterId !== auth.data.id) return fail("Not yours");
  return ok(booking);
}

/** Owner reads a booking on one of their own cars (e.g. to follow a trip). */
export function getBookingForOwner(bookingId) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking) return fail("Booking not found.");
  if (booking.ownerId !== auth.data.id) return fail("Not yours");
  return ok(booking);
}

export function listRenterBookings() {
  const auth = requireRole("renter");
  if (!auth.ok) return [];
  return getBookings().filter((b) => b.renterId === auth.data.id);
}

export function listOwnerBookings() {
  const auth = requireRole("owner");
  if (!auth.ok) return [];
  return getBookings().filter((b) => b.ownerId === auth.data.id);
}

export function listAllBookingsForAdmin() {
  const auth = requireRole("admin");
  if (!auth.ok) return [];
  return getBookings();
}
