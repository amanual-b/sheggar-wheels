import { getUsers, saveUser } from "./data.js";
import { newId } from "./ids.js";
import { fail, ok } from "./result.js";
import { requireRole, signInAsDemo } from "./session.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+251|251|0)?[79]\d{8}$/;

/** Public sign-up. Roles are always renter (+ optional owner). Never admin. */
export function createDemoAccount({ name, email, phone, alsoOwner } = {}) {
  const errors = {};
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").replace(/[\s-]/g, "");
  if (cleanName.length < 2) errors.name = "Enter your full name (at least 2 characters).";
  if (!cleanEmail) errors.email = "Enter an email address.";
  else if (!EMAIL_RE.test(cleanEmail)) errors.email = "Enter a valid email address.";
  else if (getUsers().some((u) => u.email.toLowerCase() === cleanEmail)) errors.email = "That email is already used by another account.";
  if (cleanPhone && !PHONE_RE.test(cleanPhone)) errors.phone = "Use an Ethiopian mobile number such as 0911 123 456.";
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", errors };

  const user = {
    id: newId("u"),
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    roles: alsoOwner ? ["renter", "owner"] : ["renter"],
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const saved = saveUser(user);
  if (!saved.ok) return { ok: false, error: saved.error, errors: {} };
  const signedIn = signInAsDemo(user.id);
  if (!signedIn.ok) return { ok: false, error: signedIn.error, errors: {} };
  return { ok: true, data: user };
}

/** A renter can add owner capability to the same account. Admin can never be self-assigned. */
export function enableOwnerRole() {
  const auth = requireRole("renter");
  if (!auth.ok) return auth;
  const user = auth.data;
  if (user.roles.includes("owner")) return ok(user);
  const updated = { ...user, roles: [...user.roles, "owner"] };
  const saved = saveUser(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}
