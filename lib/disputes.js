import { getBookings, getDisputes, saveDispute } from "./data.js";
import { requireRole, hasRole, getCurrentSession } from "./session.js";
import { moveBooking } from "./bookings.js";
import { DISPUTE_REASONS } from "./constants.js";
import { newId } from "./ids.js";
import { nowISO } from "./dates.js";
import { fail, ok } from "./result.js";

function isParty(booking, user) {
  return booking.renterId === user.id || booking.ownerId === user.id;
}

/** Renter or owner raises an issue on an in-progress booking they are part of. */
export function openDispute({ bookingId, reason, description } = {}) {
  const session = getCurrentSession();
  if (!session) return fail("Not signed in");
  const user = session.user;
  if (user.status === "suspended") return fail("Account suspended");
  const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking) return fail("Booking not found.");
  if (!isParty(booking, user)) return fail("Not yours");
  if (booking.status !== "in_progress") return fail("Issues can only be raised while a rental is in progress.");
  if (!DISPUTE_REASONS.includes(reason)) return fail("Choose a reason.");
  const text = String(description || "").trim();
  if (text.length < 10) return fail("Describe the issue in at least 10 characters.");
  if (text.length > 600) return fail("Keep the description under 600 characters.");

  const dispute = {
    id: newId("dp"),
    bookingId: booking.id,
    openedBy: user.id,
    reason,
    description: text,
    status: "open",
    resolutionNotes: "",
    resolvedBy: null,
    createdAt: nowISO(),
    resolvedAt: null,
    messages: [],
  };
  const saved = saveDispute(dispute);
  if (!saved.ok) return fail(saved.error);
  const moved = moveBooking(booking, "disputed", user.id);
  return moved.ok ? ok(dispute) : moved;
}

/** Disputes the signed-in user may see: their own bookings (renter/owner) or all (admin). */
export function listDisputesForUser() {
  const session = getCurrentSession();
  if (!session || session.user.status === "suspended") return [];
  const user = session.user;
  const all = getDisputes();
  if (hasRole(user, "admin")) return all;
  const bookings = getBookings();
  return all.filter((d) => {
    const b = bookings.find((x) => x.id === d.bookingId);
    return b && isParty(b, user);
  });
}

export function getDisputeForUser(disputeId) {
  const session = getCurrentSession();
  if (!session) return fail("Not signed in");
  const user = session.user;
  if (user.status === "suspended") return fail("Account suspended");
  const dispute = getDisputes().find((d) => d.id === disputeId);
  if (!dispute) return fail("Dispute not found.");
  if (hasRole(user, "admin")) return ok(dispute);
  const booking = getBookings().find((b) => b.id === dispute.bookingId);
  if (!booking || !isParty(booking, user)) return fail("Not yours");
  return ok(dispute);
}

/** Renter/owner add a note to an open dispute they are part of. */
export function addDisputeMessage(disputeId, text) {
  const found = getDisputeForUser(disputeId);
  if (!found.ok) return found;
  const user = getCurrentSession().user;
  const dispute = found.data;
  if (hasRole(user, "admin") && !hasRole(user, "owner") && !hasRole(user, "renter")) return fail("Admins resolve disputes instead of replying.");
  if (dispute.status !== "open") return fail("This dispute is already resolved.");
  const body = String(text || "").trim();
  if (body.length < 2) return fail("Write a short message.");
  if (body.length > 500) return fail("Keep the message under 500 characters.");
  const updated = { ...dispute, messages: [...dispute.messages, { by: user.id, text: body, at: nowISO() }] };
  const saved = saveDispute(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}

/** Admin resolves an open dispute and records notes. */
export function resolveDispute(disputeId, notes) {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  const dispute = getDisputes().find((d) => d.id === disputeId);
  if (!dispute) return fail("Dispute not found.");
  if (dispute.status !== "open") return fail("This dispute is already resolved.");
  const text = String(notes || "").trim();
  if (text.length < 10) return fail("Resolution notes need at least 10 characters.");
  if (text.length > 800) return fail("Keep the notes under 800 characters.");
  const booking = getBookings().find((b) => b.id === dispute.bookingId);
  if (!booking) return fail("The booking for this dispute no longer exists.");
  if (booking.status !== "disputed") return fail("The booking is not in a disputed state.");

  const updated = { ...dispute, status: "resolved", resolutionNotes: text, resolvedBy: auth.data.id, resolvedAt: nowISO() };
  const saved = saveDispute(updated);
  if (!saved.ok) return fail(saved.error);
  const moved = moveBooking(booking, "resolved", auth.data.id, "paid");
  return moved.ok ? ok(updated) : moved;
}
