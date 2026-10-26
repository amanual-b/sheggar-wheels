// Data-access module: the only place that reads or writes the durable collections.
import { COLLECTIONS, KEYS, hasKey, isStorageAvailable, readStorage, removeStorage, writeStorage } from "./storage.js";
import { buildSeed } from "./seed.js";

let checkedThisPage = false;

/** Seed once, only for keys that are absent. Never overwrites existing user data. */
export function initializeDemoData() {
  // Cheap fast path: after the keys were confirmed present once, skip all work.
  if (checkedThisPage && hasKey(KEYS.cars)) return { ok: true, seeded: 0 };
  if (!isStorageAvailable(false)) return { ok: false, error: "Browser storage is unavailable." };
  const missing = COLLECTIONS.filter((name) => !hasKey(KEYS[name]));
  let seeded = 0;
  if (missing.length) {
    const seed = buildSeed(); // only built when something is actually missing
    for (const name of missing) if (writeStorage(KEYS[name], seed[name]).ok) seeded += 1;
  }
  checkedThisPage = true;
  return { ok: true, seeded };
}

/** Development-only control: restores seed data and clears the session. */
export function resetDemoData() {
  checkedThisPage = false;
  const seed = buildSeed();
  for (const name of COLLECTIONS) removeStorage(KEYS[name]);
  removeStorage(KEYS.session, { session: true });
  removeStorage(KEYS.checkoutDraft, { session: true });
  removeStorage(KEYS.notifSeen, { session: true });
  for (const name of COLLECTIONS) writeStorage(KEYS[name], seed[name]);
  return { ok: true };
}

function readList(name) {
  initializeDemoData();
  const list = readStorage(KEYS[name], [], { validate: Array.isArray });
  return list.filter((x) => x && typeof x === "object" && typeof x.id === "string");
}

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// Normalisers keep a hand-edited record from crashing the UI.
const normUser = (u) => ({ ...u, name: String(u.name || "Unknown"), email: String(u.email || ""), roles: arr(u.roles), status: u.status === "suspended" ? "suspended" : "active" });
const normCar = (c) => ({ ...c, photos: arr(c.photos), unavailableDates: arr(c.unavailableDates), pricePerDay: num(c.pricePerDay), seats: num(c.seats, 4), year: num(c.year), latitude: num(c.latitude, 9.0), longitude: num(c.longitude, 38.76), status: c.status || "draft" });
const normBooking = (b) => ({ ...b, days: num(b.days), pricePerDay: num(b.pricePerDay), subtotal: num(b.subtotal), fee: num(b.fee), total: num(b.total), statusHistory: arr(b.statusHistory) });
const normDispute = (x) => ({ ...x, messages: arr(x.messages) });

export const getUsers = () => readList("users").map(normUser);
export const getCars = () => readList("cars").map(normCar);
export const getBookings = () => readList("bookings").map(normBooking);
export const getReviews = () => readList("reviews");
export const getDisputes = () => readList("disputes").map(normDispute);
export const getAnnouncements = () => readList("announcements");

function upsert(name, record) {
  const list = readList(name);
  const i = list.findIndex((x) => x.id === record.id);
  if (i >= 0) list[i] = record;
  else list.push(record);
  return writeStorage(KEYS[name], list);
}

export const saveUser = (user) => upsert("users", user);
export const saveCar = (car) => upsert("cars", car);
export const saveBooking = (booking) => upsert("bookings", booking);
export const saveReview = (review) => upsert("reviews", review);
export const saveDispute = (dispute) => upsert("disputes", dispute);
export const saveAnnouncement = (a) => upsert("announcements", a);

export const getCarById = (id) => getCars().find((c) => c.id === id) || null;
export const getUserById = (id) => getUsers().find((u) => u.id === id) || null;
