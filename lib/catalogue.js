// Pure search / filter / sort / pagination helpers for the public catalogue.
import { BLOCKING_STATUSES } from "./bookings.js";
import { isValidISODate, rangesOverlap } from "./dates.js";
import { PAGE_SIZE } from "./constants.js";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest listings" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
];

export const FILTER_KEYS = ["q", "neighbourhood", "minPrice", "maxPrice", "transmission", "seats", "from", "to", "sort", "page"];

const intOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/** `params` is anything with .get(name) (URLSearchParams / ReadonlyURLSearchParams). */
export function parseFilters(params) {
  const get = (k) => (params && typeof params.get === "function" ? params.get(k) : null) || "";
  const from = get("from");
  const to = get("to");
  const sort = get("sort");
  return {
    q: get("q").trim().slice(0, 60),
    neighbourhood: get("neighbourhood"),
    minPrice: intOrNull(get("minPrice")),
    maxPrice: intOrNull(get("maxPrice")),
    transmission: ["Automatic", "Manual"].includes(get("transmission")) ? get("transmission") : "",
    seats: intOrNull(get("seats")),
    from: isValidISODate(from) ? from : "",
    to: isValidISODate(to) ? to : "",
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "newest",
    page: Math.max(1, intOrNull(get("page")) || 1),
  };
}

export function hasActiveFilters(f) {
  return !!(f.q || f.neighbourhood || f.minPrice !== null || f.maxPrice !== null || f.transmission || f.seats !== null || f.from || f.to);
}

export function popularityOf(carId, bookings) {
  return bookings.filter((b) => b.carId === carId && !["cancelled", "declined"].includes(b.status)).length;
}

export function isAvailableForRange(car, bookings, from, to) {
  const start = from || to;
  const end = to || from;
  if (!start) return true;
  if ((car.unavailableDates || []).some((d) => d >= start && d <= end)) return false;
  return !bookings.some((b) => b.carId === car.id && BLOCKING_STATUSES.includes(b.status) && rangesOverlap(start, end, b.startDate, b.endDate));
}

export function filterCars(cars, f, bookings = []) {
  const q = f.q.toLowerCase();
  return cars.filter((c) => {
    if (q) {
      const hay = `${c.make} ${c.model} ${c.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.neighbourhood && c.neighbourhood !== f.neighbourhood && c.city !== f.neighbourhood) return false;
    if (f.minPrice !== null && c.pricePerDay < f.minPrice) return false;
    if (f.maxPrice !== null && c.pricePerDay > f.maxPrice) return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.seats !== null && c.seats < f.seats) return false;
    if ((f.from || f.to) && !isAvailableForRange(c, bookings, f.from, f.to)) return false;
    return true;
  });
}

export function sortCars(cars, sort, bookings = []) {
  const list = [...cars];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    case "price-desc":
      return list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    case "popular":
      return list.sort((a, b) => popularityOf(b.id, bookings) - popularityOf(a.id, bookings) || a.pricePerDay - b.pricePerDay);
    default:
      return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
}

/** Clamps the page so filtering can never strand the user on an empty page. */
export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page || 1), totalPages);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, totalPages, total: items.length, pageSize };
}

/** Build a query string from filters, omitting defaults. */
export function filtersToQuery(f) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.neighbourhood) p.set("neighbourhood", f.neighbourhood);
  if (f.minPrice !== null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice !== null) p.set("maxPrice", String(f.maxPrice));
  if (f.transmission) p.set("transmission", f.transmission);
  if (f.seats !== null) p.set("seats", String(f.seats));
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  return p.toString();
}
