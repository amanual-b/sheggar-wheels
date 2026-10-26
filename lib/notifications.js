// In-app notifications derived from demo records (no server push).
import { hasRole } from "./session.js";
import { STATUS_LABELS } from "./constants.js";

const carName = (cars, id) => {
  const c = cars.find((x) => x.id === id);
  return c ? `${c.make} ${c.model}` : "a car";
};

export function buildNotifications(user, { cars = [], bookings = [], disputes = [], announcements = [] } = {}) {
  if (!user) return [];
  const out = [];
  const isOwner = hasRole(user, "owner");
  const isRenter = hasRole(user, "renter");
  const isAdmin = hasRole(user, "admin");

  for (const a of announcements) {
    if (a.active) out.push({ id: `an_${a.id}`, title: a.title, body: a.message, at: a.createdAt, href: "/", tone: "info" });
  }

  for (const b of bookings) {
    const car = carName(cars, b.carId);
    const history = b.statusHistory || [];
    if (isRenter && b.renterId === user.id) {
      for (const h of history.slice(1)) {
        out.push({ id: `bk_${b.id}_${h.status}`, title: `Booking ${STATUS_LABELS[h.status]?.toLowerCase() || h.status}`, body: `${car} (${b.startDate})`, at: h.at, href: `/bookings/${b.id}`, tone: ["declined", "cancelled", "disputed"].includes(h.status) ? "warning" : "success" });
      }
    }
    if (isOwner && b.ownerId === user.id) {
      const first = history[0];
      if (first) out.push({ id: `own_${b.id}_new`, title: b.status === "requested" ? "New booking request" : "Booking request received", body: `${car} for ${b.startDate}`, at: first.at, href: `/owner/cars/${b.carId}/bookings`, tone: b.status === "requested" ? "warning" : "info" });
    }
  }

  if (isAdmin) {
    for (const c of cars.filter((x) => x.status === "pending")) {
      out.push({ id: `adm_car_${c.id}`, title: "Listing awaiting review", body: `${c.make} ${c.model} ${c.year}`, at: c.createdAt, href: "/admin/listings", tone: "warning" });
    }
    for (const d of disputes.filter((x) => x.status === "open")) {
      out.push({ id: `adm_dp_${d.id}`, title: "Open dispute", body: d.reason, at: d.createdAt, href: `/admin/disputes/${d.id}`, tone: "warning" });
    }
  }
  if (isOwner) {
    for (const d of disputes.filter((x) => x.status === "open")) {
      const b = bookings.find((x) => x.id === d.bookingId);
      if (b && b.ownerId === user.id) out.push({ id: `own_dp_${d.id}`, title: "Dispute on your rental", body: d.reason, at: d.createdAt, href: "/owner/disputes", tone: "warning" });
    }
  }

  return out.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 20);
}
