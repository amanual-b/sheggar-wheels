// Live guardrail checks. Each one tries ordinary misuse and verifies the code refuses safely.
// These demonstrate frontend design only - they are NOT proof of real security.
import { KEYS, readStorage, removeStorage, writeStorage } from "./storage.js";
import { getBookings, getCars, getUsers } from "./data.js";
import { cancelBooking, createBookingRequest, getBookingForRenter } from "./bookings.js";
import { saveCarListing } from "./cars.js";
import { safeReturnPath } from "./session.js";
import { addDays, todayISO } from "./dates.js";

function withSession(userId, fn) {
  const previous = readStorage(KEYS.session, null, { session: true });
  try {
    if (userId) writeStorage(KEYS.session, { userId, signedInAt: new Date().toISOString(), mode: "test" }, { session: true });
    else removeStorage(KEYS.session, { session: true });
    return fn();
  } finally {
    if (previous) writeStorage(KEYS.session, previous, { session: true });
    else removeStorage(KEYS.session, { session: true });
  }
}

const snapshot = () => JSON.stringify([getBookings(), getCars()]);

export function runNegativeTests() {
  const results = [];
  const record = (id, title, expected, actual, passed) => results.push({ id, title, expected, actual, passed: !!passed });

  // 1. Signed-out write attempt
  {
    const car = getCars().find((c) => c.status === "approved");
    const before = snapshot();
    const res = withSession(null, () => createBookingRequest({ carId: car?.id, startDate: addDays(todayISO(), 5), endDate: addDays(todayISO(), 6) }));
    const unchanged = snapshot() === before;
    record(1, "Signed-out booking attempt", 'Refused with "Not signed in"; no booking created', res.ok ? "Booking created" : res.error, !res.ok && res.error === "Not signed in" && unchanged);
  }

  // 2. Cross-user ownership attempt
  {
    const users = getUsers();
    const victim = getBookings().find((b) => ["requested", "confirmed"].includes(b.status));
    const attacker = victim ? users.find((u) => u.roles.includes("renter") && u.id !== victim.renterId && u.status === "active") : null;
    if (victim && attacker) {
      const before = snapshot();
      const res = withSession(attacker.id, () => cancelBooking(victim.id));
      record(2, "Cancel another renter's booking", 'Refused with "Not yours"; data unchanged', res.ok ? "Booking cancelled" : res.error, !res.ok && res.error === "Not yours" && snapshot() === before);
      const view = withSession(attacker.id, () => getBookingForRenter(victim.id));
      record(3, "View another renter's booking", 'Refused with "Not yours"', view.ok ? "Booking returned" : view.error, !view.ok && view.error === "Not yours");
    } else {
      record(2, "Cancel another renter's booking", "Needs a second renter and an active booking", "Not enough sample records - use Reset saved data on this page", false);
    }
  }

  // 4. Unsafe return URL
  {
    const hostile = ["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)", "/%2F%2Fexample.com", "http:/example.com"];
    const leaked = hostile.filter((h) => safeReturnPath(h) !== "/");
    const safe = safeReturnPath("/cars/car_tucson?from=2030-01-01");
    record(4, "Unsafe return URL (?next=https://example.com)", "External URLs fall back to /; internal paths are kept", leaked.length ? `Not rejected: ${leaked.join(", ")}` : `All ${hostile.length} hostile values rejected; internal path kept`, leaked.length === 0 && safe === "/cars/car_tucson?from=2030-01-01");
  }

  // 5. Owner edits another owner's car by changing the id
  {
    const cars = getCars();
    const victim = cars.find((c) => c.status === "approved");
    const attacker = getUsers().find((u) => u.roles.includes("owner") && u.id !== victim?.ownerId && u.status === "active");
    if (victim && attacker) {
      const before = snapshot();
      const res = withSession(attacker.id, () => saveCarListing({ ...victim, pricePerDay: 1 }, { carId: victim.id }));
      record(5, "Edit another owner's car", 'Refused with "Not yours"; data unchanged', res.ok ? "Car edited" : res.error, !res.ok && res.error === "Not yours" && snapshot() === before);
    }
  }

  // 6. Invalid lifecycle transition
  {
    const done = getBookings().find((b) => b.status === "completed");
    if (done) {
      const before = snapshot();
      const res = withSession(done.renterId, () => cancelBooking(done.id));
      record(6, "Cancel a completed booking", "Refused; data unchanged", res.ok ? "Booking cancelled" : res.error, !res.ok && snapshot() === before);
    }
  }
  return results;
}
