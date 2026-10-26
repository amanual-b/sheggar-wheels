import { getAnnouncements, getCars, getUsers, saveAnnouncement, saveCar, saveUser } from "./data.js";
import { requireRole, hasRole } from "./session.js";
import { newId } from "./ids.js";
import { nowISO } from "./dates.js";
import { fail, ok } from "./result.js";

/** Admin approves or rejects a pending listing. Rejection needs a reason. */
export function moderateCar(carId, decision, reason = "") {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  const car = getCars().find((c) => c.id === carId);
  if (!car) return fail("Car not found.");
  if (car.status !== "pending") return fail("Only pending listings can be moderated.");
  if (decision === "approve") {
    const updated = { ...car, status: "approved", wasApproved: true, rejectionReason: "" };
    const saved = saveCar(updated);
    return saved.ok ? ok(updated) : fail(saved.error);
  }
  if (decision === "reject") {
    const text = String(reason || "").trim();
    if (text.length < 5) return fail("Give the owner a short reason (at least 5 characters).");
    const updated = { ...car, status: "rejected", rejectionReason: text.slice(0, 300) };
    const saved = saveCar(updated);
    return saved.ok ? ok(updated) : fail(saved.error);
  }
  return fail("Unknown decision.");
}

/** Suspend or reinstate a demo user. Admin accounts cannot be suspended. */
export function setUserStatus(userId, status) {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  if (!["active", "suspended"].includes(status)) return fail("Unknown status.");
  const user = getUsers().find((u) => u.id === userId);
  if (!user) return fail("User not found.");
  if (hasRole(user, "admin")) return fail("Administrator accounts cannot be suspended.");
  if (user.id === auth.data.id) return fail("You cannot change your own status.");
  const updated = { ...user, status };
  const saved = saveUser(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}

export function publishAnnouncement({ title, message } = {}) {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  const t = String(title || "").trim();
  const m = String(message || "").trim();
  if (t.length < 3) return fail("Add a title (at least 3 characters).");
  if (t.length > 80) return fail("Keep the title under 80 characters.");
  if (m.length < 10) return fail("Write a message of at least 10 characters.");
  if (m.length > 400) return fail("Keep the message under 400 characters.");
  const a = { id: newId("an"), title: t, message: m, active: true, createdAt: nowISO(), createdBy: auth.data.id };
  const saved = saveAnnouncement(a);
  return saved.ok ? ok(a) : fail(saved.error);
}

export function setAnnouncementActive(id, active) {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return fail("Announcement not found.");
  const updated = { ...a, active: !!active };
  const saved = saveAnnouncement(updated);
  return saved.ok ? ok(updated) : fail(saved.error);
}
