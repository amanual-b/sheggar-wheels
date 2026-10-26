// Permission-aware CSV exports. Each export contains only data the signed-in user may see.
import { getCars, getReviews, getUsers } from "./data.js";
import { listAllBookingsForAdmin, listOwnerBookings, listRenterBookings } from "./bookings.js";
import { requireRole } from "./session.js";
import { EARNED_STATUSES, earningsByMonth, adminMetrics } from "./metrics.js";
import { STATUS_LABELS } from "./constants.js";
import { toCSV } from "./csv.js";
import { fail, ok } from "./result.js";
import { todayISO } from "./dates.js";

const carName = (cars, id) => {
  const c = cars.find((x) => x.id === id);
  return c ? `${c.make} ${c.model} ${c.year}` : "Unknown car";
};
const userName = (users, id) => users.find((u) => u.id === id)?.name || "Unknown";
const label = (s) => STATUS_LABELS[s] || s;

function bookingColumns(cars, users, withParties) {
  const cols = [
    { header: "Booking ID", value: (b) => b.id },
    { header: "Car", value: (b) => carName(cars, b.carId) },
    { header: "Start date", value: (b) => b.startDate },
    { header: "End date", value: (b) => b.endDate },
    { header: "Days", value: (b) => b.days },
    { header: "Price per day (ETB)", value: (b) => b.pricePerDay },
    { header: "Subtotal (ETB)", value: (b) => b.subtotal },
    { header: "Service fee (ETB)", value: (b) => b.fee },
    { header: "Total (ETB)", value: (b) => b.total },
    { header: "Status", value: (b) => label(b.status) },
    { header: "Payment", value: (b) => label(b.paymentStatus) },
    { header: "Created", value: (b) => b.createdAt },
  ];
  if (withParties) {
    cols.splice(2, 0, { header: "Renter", value: (b) => userName(users, b.renterId) }, { header: "Owner", value: (b) => userName(users, b.ownerId) });
  }
  return cols;
}

export function exportRenterBookingsCsv() {
  const auth = requireRole("renter");
  if (!auth.ok) return auth;
  const rows = listRenterBookings();
  return ok({ filename: "my-bookings.csv", csv: toCSV(rows, bookingColumns(getCars(), [], false)) });
}

export function exportOwnerBookingsCsv() {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const rows = listOwnerBookings();
  return ok({ filename: "owner-bookings.csv", csv: toCSV(rows, bookingColumns(getCars(), getUsers(), true)) });
}

export function exportOwnerEarningsCsv() {
  const auth = requireRole("owner");
  if (!auth.ok) return auth;
  const rows = earningsByMonth(listOwnerBookings(), 6, todayISO());
  return ok({ filename: "owner-earnings.csv", csv: toCSV(rows, [{ header: "Month", value: (r) => r.month }, { header: "Earnings (ETB)", value: (r) => r.earnings }]) });
}

export function exportAdminReportCsv(kind = "bookings") {
  const auth = requireRole("admin");
  if (!auth.ok) return auth;
  const bookings = listAllBookingsForAdmin();
  const cars = getCars();
  const users = getUsers();
  if (kind === "bookings") return ok({ filename: "platform-bookings.csv", csv: toCSV(bookings, bookingColumns(cars, users, true)) });
  if (kind === "listings") {
    return ok({
      filename: "platform-listings.csv",
      csv: toCSV(cars, [
        { header: "Car ID", value: (c) => c.id },
        { header: "Car", value: (c) => `${c.make} ${c.model} ${c.year}` },
        { header: "Owner", value: (c) => userName(users, c.ownerId) },
        { header: "Neighbourhood", value: (c) => c.neighbourhood },
        { header: "Price per day (ETB)", value: (c) => c.pricePerDay },
        { header: "Status", value: (c) => label(c.status) },
        { header: "Avg rating", value: (c) => { const r = getReviews().filter((x) => x.carId === c.id); return r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : ""; } },
      ]),
    });
  }
  if (kind === "users") {
    return ok({
      filename: "platform-users.csv",
      csv: toCSV(users, [
        { header: "User ID", value: (u) => u.id },
        { header: "Name", value: (u) => u.name },
        { header: "Email", value: (u) => u.email },
        { header: "Roles", value: (u) => u.roles.join(" / ") },
        { header: "Status", value: (u) => label(u.status) },
        { header: "Created", value: (u) => u.createdAt },
      ]),
    });
  }
  if (kind === "summary") {
    const m = adminMetrics(users, cars, bookings);
    const rows = [
      ["Total users", m.totalUsers],
      ["Active users", m.activeUsers],
      ["Approved cars", m.approvedCars],
      ["Pending cars", m.pendingCars],
      ["Total bookings", m.totalBookings],
      ["Gross booking value (ETB)", m.gross],
      ["Platform fee (ETB)", m.platformFee],
    ];
    return ok({ filename: "platform-summary.csv", csv: toCSV(rows, [{ header: "Metric", value: (r) => r[0] }, { header: "Value", value: (r) => r[1] }]) });
  }
  return fail("Unknown report.");
}

export { EARNED_STATUSES };
