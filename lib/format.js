// Reusable formatting helpers (ETB currency, dates, relative time, labels).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatETB(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "ETB 0";
  return "ETB " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "2026-11-05" -> "5 Nov 2026" */
export function formatDate(iso) {
  if (typeof iso !== "string" || iso.length < 10) return "-";
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  if (!m || !d || m > 12) return "-";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatMonth(key) {
  if (typeof key !== "string" || key.length < 7) return "-";
  return `${MONTHS[Number(key.slice(5, 7)) - 1] || "?"} ${key.slice(0, 4)}`;
}

export function formatDateRange(start, end) {
  return start === end ? formatDate(start) : `${formatDate(start)} to ${formatDate(end)}`;
}

export function formatDateTime(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "-";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hh}:${mm}`;
}

/** "3 days ago", "in 2 hours", "just now". */
export function formatRelative(ts, now = Date.now()) {
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return "-";
  const diff = t - now;
  const abs = Math.abs(diff);
  const units = [
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];
  for (const [name, ms] of units) {
    if (abs >= ms) {
      const v = Math.floor(abs / ms);
      const label = `${v} ${name}${v === 1 ? "" : "s"}`;
      return diff < 0 ? `${label} ago` : `in ${label}`;
    }
  }
  return "just now";
}

export function pluralize(n, one, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
