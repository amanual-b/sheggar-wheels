// Pure metric calculators used by dashboards, charts and CSV reports.
import { addDays, monthKey, overlapDays, todayISO } from "./dates.js";

/** Bookings whose money has been released (earnings are recognised). */
export const EARNED_STATUSES = ["completed", "reviewed", "resolved"];
/** Bookings that are committed but not finished. */
export const UPCOMING_STATUSES = ["requested", "confirmed"];
const ACTIVE_FOR_UTILIZATION = ["confirmed", "in_progress", "completed", "reviewed", "resolved", "disputed"];

export function lastMonthKeys(count = 6, today = todayISO()) {
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const idx = y * 12 + (m - 1) - i;
    keys.push(`${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function renterMetrics(bookings, today = todayISO()) {
  const upcoming = bookings.filter((b) => ["requested", "confirmed"].includes(b.status) && b.endDate >= today);
  const next = [...upcoming].sort((a, b) => a.startDate.localeCompare(b.startDate))[0] || null;
  return {
    upcoming: upcoming.length,
    completed: bookings.filter((b) => ["completed", "reviewed", "resolved"].includes(b.status)).length,
    cancelled: bookings.filter((b) => ["cancelled", "declined"].includes(b.status)).length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    next,
    totalSpend: bookings.filter((b) => EARNED_STATUSES.includes(b.status)).reduce((s, b) => s + b.total, 0),
  };
}

export function earningsByMonth(bookings, months = 6, today = todayISO()) {
  const keys = lastMonthKeys(months, today);
  const totals = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const b of bookings) {
    if (!EARNED_STATUSES.includes(b.status)) continue;
    const k = monthKey(b.startDate);
    if (k in totals) totals[k] += b.subtotal;
  }
  return keys.map((k) => ({ month: k, earnings: totals[k] }));
}

export function bookingVolumeByMonth(bookings, months = 6, today = todayISO()) {
  const keys = lastMonthKeys(months, today);
  const totals = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const b of bookings) {
    const k = monthKey(b.startDate);
    if (k in totals) totals[k] += 1;
  }
  return keys.map((k) => ({ month: k, bookings: totals[k] }));
}

/** Share of the last `windowDays` days a car was booked. */
export function utilization(carId, bookings, windowDays = 30, today = todayISO()) {
  const winStart = addDays(today, -(windowDays - 1));
  let booked = 0;
  for (const b of bookings) {
    if (b.carId === carId && ACTIVE_FOR_UTILIZATION.includes(b.status)) booked += overlapDays(winStart, today, b.startDate, b.endDate);
  }
  return Math.min(100, Math.round((booked / windowDays) * 100));
}

export function ownerMetrics(cars, bookings, today = todayISO()) {
  const approved = cars.filter((c) => c.status === "approved").length;
  const earned = bookings.filter((b) => EARNED_STATUSES.includes(b.status));
  const perCar = cars.map((c) => {
    const mine = bookings.filter((b) => b.carId === c.id);
    return {
      car: c,
      trips: mine.filter((b) => EARNED_STATUSES.includes(b.status)).length,
      earnings: mine.filter((b) => EARNED_STATUSES.includes(b.status)).reduce((s, b) => s + b.subtotal, 0),
      utilization: utilization(c.id, bookings, 30, today),
    };
  });
  return {
    approvedCars: approved,
    pendingCars: cars.filter((c) => c.status === "pending").length,
    pendingRequests: bookings.filter((b) => b.status === "requested").length,
    confirmedRentals: bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status)).length,
    totalEarnings: earned.reduce((s, b) => s + b.subtotal, 0),
    heldEarnings: bookings.filter((b) => ["confirmed", "in_progress", "disputed"].includes(b.status)).reduce((s, b) => s + b.subtotal, 0),
    byMonth: earningsByMonth(bookings, 6, today),
    perCar,
  };
}

export function adminMetrics(users, cars, bookings, today = todayISO()) {
  const byStatus = {};
  for (const b of bookings) byStatus[b.status] = (byStatus[b.status] || 0) + 1;
  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    suspendedUsers: users.filter((u) => u.status === "suspended").length,
    approvedCars: cars.filter((c) => c.status === "approved").length,
    pendingCars: cars.filter((c) => c.status === "pending").length,
    totalBookings: bookings.length,
    byStatus,
    volume: bookingVolumeByMonth(bookings, 6, today),
    platformFee: bookings.filter((b) => EARNED_STATUSES.includes(b.status)).reduce((s, b) => s + b.fee, 0),
    gross: bookings.filter((b) => EARNED_STATUSES.includes(b.status)).reduce((s, b) => s + b.total, 0),
  };
}
