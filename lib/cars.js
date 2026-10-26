// Car listing domain: owner CRUD, availability and public visibility rules.
import { getBookings, getCars, getUsers, saveCar } from "./data.js";
import { requireRole } from "./session.js";
import { BLOCKING_STATUSES, isCarPubliclyBookable } from "./bookings.js";
import { CITY, FUEL_TYPES, NEIGHBOURHOODS, TRANSMISSIONS } from "./constants.js";
import { isValidISODate, nowISO, todayISO } from "./dates.js";
import { DEMO_PHOTOS } from "./photos.js";
import { newId } from "./ids.js";
import { fail, ok } from "./result.js";

/** Only approved cars whose owner is not suspended appear publicly. */
export function getPublicCars() {
  const users = getUsers();
  return getCars().filter((c) => isCarPubliclyBookable(c, users));
}

export function listOwnerCars() {
  const auth = requireRole("owner");
  if (!auth.ok) return [];
  return getCars().filter((c) => c.ownerId === auth.data.id);
}

/** Owner reads one of their own cars (for the edit/availability pages). */
export function getOwnerCar(carId) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const car = getCars().find((c) => c.id === carId);
  if (!car) return fail("Car not found.");
  if (car.ownerId !== auth.data.id) return fail("Not yours");
  return ok(car);
}

/** Validates a listing form. Returns { values, errors }. */
export function validateCarInput(input) {
  const errors = {};
  const make = String(input.make || "").trim();
  const model = String(input.model || "").trim();
  const description = String(input.description || "").trim();
  const year = Number(input.year);
  const seats = Number(input.seats);
  const price = Number(input.pricePerDay);
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const photos = Array.isArray(input.photos) ? input.photos.filter((p) => DEMO_PHOTOS.some((d) => d.src === p)) : [];
  const maxYear = new Date().getFullYear() + 1;

  if (make.length < 2) errors.make = "Enter the make (for example Toyota).";
  if (model.length < 1) errors.model = "Enter the model.";
  if (!Number.isInteger(year) || year < 1995 || year > maxYear) errors.year = `Enter a year between 1995 and ${maxYear}.`;
  if (!TRANSMISSIONS.includes(input.transmission)) errors.transmission = "Choose a transmission.";
  if (!FUEL_TYPES.includes(input.fuel)) errors.fuel = "Choose a fuel type.";
  if (!Number.isInteger(seats) || seats < 2 || seats > 9) errors.seats = "Seats must be between 2 and 9.";
  if (!NEIGHBOURHOODS.some((n) => n.name === input.neighbourhood)) errors.neighbourhood = "Choose a neighbourhood.";
  if (!Number.isFinite(price) || price < 500 || price > 50000) errors.pricePerDay = "Price must be between ETB 500 and ETB 50,000 per day.";
  if (description.length < 30) errors.description = "Describe the car in at least 30 characters.";
  if (description.length > 800) errors.description = "Keep the description under 800 characters.";
  if (photos.length < 1) errors.photos = "Select at least one photo.";
  if (photos.length > 6) errors.photos = "Select at most 6 photos.";
  if (!Number.isFinite(latitude) || latitude < 8.5 || latitude > 9.5) errors.latitude = "Latitude must be near Addis Ababa (8.5 to 9.5).";
  if (!Number.isFinite(longitude) || longitude < 38.3 || longitude > 39.3) errors.longitude = "Longitude must be near Addis Ababa (38.3 to 39.3).";

  return {
    errors,
    values: { make, model, description, year, seats, pricePerDay: Math.round(price), transmission: input.transmission, fuel: input.fuel, neighbourhood: input.neighbourhood, latitude, longitude, photos },
  };
}

/**
 * Create (no carId) or edit (carId) a listing. Edits re-check ownership.
 * submit=true sends the listing for admin review.
 */
export function saveCarListing(input, { carId = null, submit = true } = {}) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const user = auth.data;

  // Ownership is checked before anything else so other owners' cars are never touched.
  const existing = carId ? getCars().find((c) => c.id === carId) : null;
  if (carId && !existing) return fail("Car not found.");
  if (existing && existing.ownerId !== user.id) return fail("Not yours");

  const { values, errors } = validateCarInput(input || {});
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", errors };

  if (existing) {
    let status = existing.status;
    if (status === "rejected" || (status === "draft" && submit)) status = "pending";
    const updated = { ...existing, ...values, city: CITY, status, rejectionReason: status === "pending" ? "" : existing.rejectionReason };
    const saved = saveCar(updated);
    return saved.ok ? ok(updated) : fail(saved.error);
  }

  const car = {
    id: newId("car"),
    ownerId: user.id,
    ...values,
    city: CITY,
    status: submit ? "pending" : "draft",
    unavailableDates: [],
    rejectionReason: "",
    wasApproved: false,
    createdAt: nowISO(),
  };
  const saved = saveCar(car);
  return saved.ok ? ok(car) : fail(saved.error);
}

/** Deactivate (approved -> inactive) or reactivate (inactive -> approved/pending). */
export function setCarActive(carId, active) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const car = getCars().find((c) => c.id === carId);
  if (!car) return fail("Car not found.");
  if (car.ownerId !== auth.data.id) return fail("Not yours");

  if (!active) {
    if (!["approved", "pending", "draft"].includes(car.status)) return fail("Only approved, pending or draft listings can be deactivated.");
    const busy = getBookings().some((b) => b.carId === car.id && BLOCKING_STATUSES.includes(b.status));
    if (busy) return fail("This car has confirmed or in-progress bookings. Resolve them before deactivating.");
    const updated = { ...car, status: "inactive" };
    const saved = saveCar(updated);
    return saved.ok ? ok(updated) : fail(saved.error);
  }
  if (car.status !== "inactive") return fail("Only inactive listings can be reactivated.");
  const updated = { ...car, status: car.wasApproved ? "approved" : "pending" };
  const saved = saveCar(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}

/** Owner replaces the list of blocked dates for one of their cars. */
export function setUnavailableDates(carId, dates) {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const car = getCars().find((c) => c.id === carId);
  if (!car) return fail("Car not found.");
  if (car.ownerId !== auth.data.id) return fail("Not yours");
  if (!Array.isArray(dates) || dates.some((d) => !isValidISODate(d))) return fail("One or more dates are invalid.");
  const today = todayISO();
  const clean = [...new Set(dates)].filter((d) => d >= today).sort();
  if (clean.length > 366) return fail("Too many blocked dates.");
  const updated = { ...car, unavailableDates: clean };
  const saved = saveCar(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}
