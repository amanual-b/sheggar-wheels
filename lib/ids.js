// Stable ID helper. Uses crypto.randomUUID() when available, otherwise a small fallback.
export function newId(prefix = "id") {
  let raw;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  } else {
    raw = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);
  }
  return `${prefix}_${raw}`;
}
