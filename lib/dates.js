// Date helpers. Dates are ISO strings (YYYY-MM-DD); timestamps are ISO date-times.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;

function parse(iso) {
  return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}

export function isValidISODate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const t = parse(value);
  return new Date(t).toISOString().slice(0, 10) === value;
}

/** Today's date in the visitor's local time zone. */
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function addDays(iso, n) {
  return new Date(parse(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function diffDays(a, b) {
  return Math.round((parse(b) - parse(a)) / DAY_MS);
}

/** Inclusive date ranges overlap. */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function eachDate(start, end) {
  const out = [];
  for (let d = start; d <= end && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Number of days two inclusive ranges share. */
export function overlapDays(aStart, aEnd, bStart, bEnd) {
  const s = aStart > bStart ? aStart : bStart;
  const e = aEnd < bEnd ? aEnd : bEnd;
  return e < s ? 0 : diffDays(s, e) + 1;
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}
