// Public site URL (optional). Only NEXT_PUBLIC_* values are read here - never secrets.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Canonical link only when a stable site URL is configured. */
export function canonicalFor(path) {
  return SITE_URL ? { canonical: path } : undefined;
}
