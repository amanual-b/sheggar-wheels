// Safe browser-storage helpers. Storage is user-editable, so every read is parsed defensively.
export const KEYS = {
  users: "sw_users_v1",
  cars: "sw_cars_v1",
  bookings: "sw_bookings_v1",
  reviews: "sw_reviews_v1",
  disputes: "sw_disputes_v1",
  announcements: "sw_announcements_v1",
  session: "sw_session_v1", // sessionStorage
  checkoutDraft: "sw_checkout_draft_v1", // sessionStorage
  notifSeen: "sw_notif_seen_v1", // sessionStorage (one-time UI flag)
};

export const COLLECTIONS = ["users", "cars", "bookings", "reviews", "disputes", "announcements"];

function getStore(session) {
  if (typeof window === "undefined") return null;
  try {
    return session ? window.sessionStorage : window.localStorage;
  } catch {
    return null; // storage blocked (private mode, disabled cookies)
  }
}

export function isStorageAvailable(session = false) {
  const s = getStore(session);
  if (!s) return false;
  try {
    s.setItem("__sw_probe__", "1");
    s.removeItem("__sw_probe__");
    return true;
  } catch {
    return false;
  }
}

export function hasKey(key, opts = {}) {
  const s = getStore(opts.session);
  if (!s) return false;
  try {
    return s.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Read + parse JSON. Returns `fallback` when missing, malformed or failing `validate`. */
export function readStorage(key, fallback, opts = {}) {
  const s = getStore(opts.session);
  if (!s) return fallback;
  let raw;
  try {
    raw = s.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null || raw === undefined) return fallback;
  try {
    const value = JSON.parse(raw);
    if (opts.validate && !opts.validate(value)) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/** Serialise + save JSON. Never throws; reports quota/unavailable errors. */
export function writeStorage(key, value, opts = {}) {
  const s = getStore(opts.session);
  if (!s) return { ok: false, error: "Browser storage is unavailable in this browser session." };
  try {
    s.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (e) {
    const quota = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
    return {
      ok: false,
      error: quota
        ? "Browser storage is full. Clear some site data or reset the saved data."
        : "Could not save to browser storage.",
    };
  }
}

export function removeStorage(key, opts = {}) {
  const s = getStore(opts.session);
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Scans durable collections so the UI can show a clear recovery message. */
export function getStorageHealth() {
  const available = isStorageAvailable(false);
  const sessionAvailable = isStorageAvailable(true);
  const issues = [];
  if (available) {
    const s = getStore(false);
    for (const name of COLLECTIONS) {
      const raw = s.getItem(KEYS[name]);
      if (raw === null) continue;
      try {
        if (!Array.isArray(JSON.parse(raw))) issues.push(KEYS[name]);
      } catch {
        issues.push(KEYS[name]);
      }
    }
  }
  return { available, sessionAvailable, issues };
}
