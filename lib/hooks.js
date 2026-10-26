"use client";
// Client data hooks. SWR re-reads browser storage on mount, focus, after our own writes
// (refreshData) and when another tab changes localStorage (storage event).
import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { getAnnouncements, getBookings, getCars, getDisputes, getReviews, getUsers } from "./data.js";
import { getCurrentSession } from "./session.js";
import { buildSeed } from "./seed.js";
import { getStorageHealth } from "./storage.js";
import { getBookingForOwner, getBookingForRenter, listAllBookingsForAdmin, listOwnerBookings, listRenterBookings } from "./bookings.js";
import { listOwnerCars } from "./cars.js";
import { listDisputesForUser } from "./disputes.js";

const key = (name, ...rest) => ["sw", name, ...rest];
const EMPTY = Object.freeze([]);

// Seed used as SWR fallback on PUBLIC pages so the server can render real cars immediately
// (good for LCP/CLS). The real browser data replaces it right after hydration.
const SEED = buildSeed();

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function refreshData() {
  return globalMutate((k) => Array.isArray(k) && k[0] === "sw");
}

export function useSession() {
  const { data } = useSWR(key("session"), () => getCurrentSession());
  return { session: data ?? null, user: data?.user ?? null, loading: data === undefined };
}

export function useStorageHealth(enabled = true) {
  const { data } = useSWR(enabled ? key("health") : null, () => getStorageHealth());
  return data;
}

/**
 * Everything public-ish (cars, users, reviews...). Role-scoped lists have their own hooks.
 * seeded: start from the seed data (public pages only) instead of an empty loading state.
 * fromSeed tells the caller the real browser data has not replaced the seed yet.
 */
export function useData({ seeded = false } = {}) {
  const opt = (name) => (seeded ? { fallbackData: SEED[name], revalidateOnMount: true } : undefined);
  const users = useSWR(key("users"), () => getUsers(), opt("users"));
  const cars = useSWR(key("cars"), () => getCars(), opt("cars"));
  const bookings = useSWR(key("bookings"), () => getBookings(), opt("bookings"));
  const reviews = useSWR(key("reviews"), () => getReviews(), opt("reviews"));
  const disputes = useSWR(key("disputes"), () => getDisputes(), opt("disputes"));
  const announcements = useSWR(key("announcements"), () => getAnnouncements(), opt("announcements"));

  const loading = [users, cars, bookings, reviews, disputes, announcements].some((r) => r.data === undefined);
  const fromSeed = seeded && cars.data === SEED.cars;
  const userById = useMemo(() => new Map((users.data || EMPTY).map((u) => [u.id, u])), [users.data]);
  const carById = useMemo(() => new Map((cars.data || EMPTY).map((c) => [c.id, c])), [cars.data]);
  return {
    loading,
    fromSeed,
    users: users.data || EMPTY,
    cars: cars.data || EMPTY,
    bookings: bookings.data || EMPTY,
    reviews: reviews.data || EMPTY,
    disputes: disputes.data || EMPTY,
    announcements: announcements.data || EMPTY,
    userById,
    carById,
  };
}

function useScoped(name, getter) {
  const { data } = useSWR(key(name), () => getter());
  return { items: data || EMPTY, loading: data === undefined };
}

export const useRenterBookings = () => useScoped("renterBookings", listRenterBookings);
export const useOwnerBookings = () => useScoped("ownerBookings", listOwnerBookings);
export const useOwnerCars = () => useScoped("ownerCars", listOwnerCars);
export const useAdminBookings = () => useScoped("adminBookings", listAllBookingsForAdmin);
export const useMyDisputes = () => useScoped("myDisputes", listDisputesForUser);

/** Booking visible to the signed-in renter, with the ownership check applied. */
export function useRenterBooking(id) {
  const { data } = useSWR(key("booking", id), () => getBookingForRenter(id));
  return data; // undefined while loading, otherwise { ok, data | error }
}

/** Booking for the trip tracker, read as the renter or as the car's owner (ownership checked either way). */
export function useTrackedBooking(id, as = "renter") {
  const { data } = useSWR(key("tracked", as, id), () => (as === "owner" ? getBookingForOwner(id) : getBookingForRenter(id)));
  return data;
}
