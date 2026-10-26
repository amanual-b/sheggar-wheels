// Demo session helpers. Only a user id + minimal metadata live in sessionStorage;
// the user record is looked up from localStorage. This is NOT production authentication.
import { KEYS, readStorage, removeStorage, writeStorage } from "./storage.js";
import { getUsers } from "./data.js";
import { fail, ok } from "./result.js";

export function hasRole(user, role) {
  return !!user && Array.isArray(user.roles) && user.roles.includes(role);
}

export function getCurrentSession() {
  const raw = readStorage(KEYS.session, null, {
    session: true,
    validate: (v) => v && typeof v === "object" && typeof v.userId === "string",
  });
  if (!raw) return null;
  const user = getUsers().find((u) => u.id === raw.userId);
  if (!user) return null;
  return { userId: user.id, user, signedInAt: raw.signedInAt || null };
}

export function signInAsDemo(userId) {
  const user = getUsers().find((u) => u.id === userId);
  if (!user) return fail("That account does not exist.");
  const saved = writeStorage(KEYS.session, { userId: user.id, signedInAt: new Date().toISOString(), mode: "demo" }, { session: true });
  if (!saved.ok) return fail(saved.error);
  return ok(user);
}

export function signInWithEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) return fail("Enter your email address.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return fail("Enter a valid email address.");
  const user = getUsers().find((u) => u.email.toLowerCase() === value);
  if (!user) return fail("No account uses that email. Pick an account or create one.");
  return signInAsDemo(user.id);
}

export function signOut() {
  removeStorage(KEYS.session, { session: true });
  removeStorage(KEYS.checkoutDraft, { session: true });
  removeStorage(KEYS.notifSeen, { session: true });
}

/**
 * Central authorisation gate used by every action before it writes.
 * Returns { ok:true, data:user } or { ok:false, error }.
 */
export function requireRole(role) {
  const session = getCurrentSession();
  if (!session) return fail("Not signed in");
  const user = session.user;
  if (user.status === "suspended") return fail("Account suspended");
  if (role && !hasRole(user, role)) return fail("Not allowed for your role");
  return ok(user);
}

/** Accepts only same-site relative paths. External or malformed targets fall back. */
export function safeReturnPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v || v.length > 500) return fallback;
  let decoded;
  try {
    decoded = decodeURIComponent(v);
  } catch {
    return fallback;
  }
  for (const s of [v, decoded]) {
    if (!s.startsWith("/")) return fallback;
    if (s.startsWith("//") || s.startsWith("/\\")) return fallback;
    if (/[\u0000-\u001f\u007f\\]/.test(s)) return fallback;
  }
  try {
    const url = new URL(v, "http://sheggar.local");
    if (url.origin !== "http://sheggar.local") return fallback;
  } catch {
    return fallback;
  }
  const path = v.split(/[?#]/)[0];
  if (path === "/signin" || path === "/signup") return fallback;
  return v;
}

/** Where to send someone after sign-in when no return path is supplied. */
export function defaultLanding(user) {
  if (hasRole(user, "admin")) return "/admin";
  return "/dashboard";
}
