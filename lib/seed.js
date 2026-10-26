// Realistic but fictional seed data. Dates are relative to "today" so upcoming/past stay meaningful.
import { addDays, todayISO } from "./dates.js";
import { computePricing } from "./pricing.js";
import { CITY, NEIGHBOURHOODS } from "./constants.js";

const hood = (name) => NEIGHBOURHOODS.find((n) => n.name === name);

export const SEED_CAR_IDS = [
  "car_corolla",
  "car_tucson",
  "car_atto3",
  "car_vitz",
  "car_sportage",
  "car_seagull",
  "car_tesla",
  "car_id4",
  "car_wuling",
];

export function buildSeed(today = todayISO()) {
  const d = (n) => addDays(today, n);
  const ts = (daysFromToday, hour = 9) =>
    new Date(`${addDays(today, daysFromToday)}T${String(hour).padStart(2, "0")}:00:00.000Z`).toISOString();

  const users = [
    { id: "u_admin", name: "Selam Admin", email: "admin@example.com", phone: "+251911000001", roles: ["admin"], status: "active", createdAt: ts(-120) },
    { id: "u_dawit", name: "Dawit Bekele", email: "dawit@example.com", phone: "+251911000002", roles: ["renter", "owner"], status: "active", createdAt: ts(-110) },
    { id: "u_hanna", name: "Hanna Tesfaye", email: "hanna@example.com", phone: "+251911000003", roles: ["renter", "owner"], status: "active", createdAt: ts(-100) },
    { id: "u_samuel", name: "Samuel Kebede", email: "samuel@example.com", phone: "+251911000004", roles: ["renter", "owner"], status: "active", createdAt: ts(-90) },
    { id: "u_meron", name: "Meron Alemu", email: "meron@example.com", phone: "+251911000005", roles: ["renter"], status: "active", createdAt: ts(-80) },
    { id: "u_yonas", name: "Yonas Girma", email: "yonas@example.com", phone: "+251911000006", roles: ["renter"], status: "active", createdAt: ts(-70) },
    { id: "u_kebede", name: "Kebede Worku", email: "kebede@example.com", phone: "+251911000007", roles: ["renter"], status: "suspended", createdAt: ts(-60) },
  ];

  const mkCar = (c) => {
    const h = hood(c.neighbourhood);
    return {
      city: CITY,
      latitude: h.lat,
      longitude: h.lng,
      unavailableDates: [],
      rejectionReason: "",
      wasApproved: c.status === "approved",
      ...c,
    };
  };

  const cars = [
    mkCar({ id: "car_corolla", ownerId: "u_dawit", make: "Toyota", model: "Corolla", year: 2019, transmission: "Manual", seats: 5, fuel: "Petrol", neighbourhood: "Bole", pricePerDay: 3200, photos: ["/cars/toyota_corolla1.jpg", "/cars/toyota_corolla2.jpg"], description: "Reliable, fuel-efficient sedan that is easy to park around Bole. Clean interior, air conditioning and a spacious boot make it a dependable choice for business days or family errands.", status: "approved", createdAt: ts(-100) }),
    mkCar({ id: "car_tucson", ownerId: "u_dawit", make: "Hyundai", model: "Tucson", year: 2022, transmission: "Automatic", seats: 5, fuel: "Petrol", neighbourhood: "Kazanchis", pricePerDay: 5200, photos: ["/cars/hyundai_tucson1.jpg", "/cars/hyundai_tucson2.jpg"], description: "Comfortable compact SUV with generous ground clearance for rough roads outside the city. Automatic gearbox, rear camera and plenty of luggage space for weekend trips.", status: "approved", unavailableDates: [d(30), d(31), d(32)], createdAt: ts(-95) }),
    mkCar({ id: "car_atto3", ownerId: "u_dawit", make: "BYD", model: "Atto 3", year: 2023, transmission: "Automatic", seats: 5, fuel: "Electric", neighbourhood: "CMC", pricePerDay: 6200, photos: ["/cars/byd_atto_31.jpg", "/cars/byd_atto_32.jpg"], description: "Quiet, quick electric crossover with a large touchscreen and home charger access at pickup. Great for city driving with very low running costs.", status: "approved", createdAt: ts(-90) }),
    mkCar({ id: "car_vitz", ownerId: "u_dawit", make: "Toyota", model: "Vitz", year: 2016, transmission: "Manual", seats: 5, fuel: "Petrol", neighbourhood: "Megenagna", pricePerDay: 2200, photos: ["/cars/toyota_vitz1.jpg", "/cars/toyota_vitz2.jpg"], description: "Small hatchback.", status: "rejected", rejectionReason: "Description is too short. Please describe condition, features and pickup details, then resubmit.", createdAt: ts(-20) }),
    mkCar({ id: "car_sportage", ownerId: "u_hanna", make: "Kia", model: "Sportage", year: 2022, transmission: "Automatic", seats: 5, fuel: "Petrol", neighbourhood: "Sarbet", pricePerDay: 5500, photos: ["/cars/kia_sportage1.jpg", "/cars/kia_sportage2.jpg"], description: "Modern SUV with a roomy cabin, heated mirrors and strong air conditioning. Ideal for family trips or airport transfers with plenty of bags.", status: "approved", createdAt: ts(-85) }),
    mkCar({ id: "car_seagull", ownerId: "u_hanna", make: "BYD", model: "Seagull", year: 2024, transmission: "Automatic", seats: 4, fuel: "Electric", neighbourhood: "Old Airport", pricePerDay: 3000, photos: ["/cars/byd_seagull1.jpg", "/cars/byd_seagull2.jpg"], description: "Compact electric hatchback that is cheap to run and effortless to park. Perfect for short city hops and errands around the Old Airport area.", status: "approved", createdAt: ts(-75) }),
    mkCar({ id: "car_tesla", ownerId: "u_hanna", make: "Tesla", model: "Model 3", year: 2021, transmission: "Automatic", seats: 5, fuel: "Electric", neighbourhood: "Bole", pricePerDay: 8500, photos: ["/cars/tesla_model_31.jpg", "/cars/tesla_model_32.jpg"], description: "Premium electric sedan with a minimalist interior, glass roof and fast acceleration. Pickup includes a short walkthrough of the controls.", status: "approved", createdAt: ts(-70) }),
    mkCar({ id: "car_id4", ownerId: "u_samuel", make: "Volkswagen", model: "ID.4", year: 2022, transmission: "Automatic", seats: 5, fuel: "Electric", neighbourhood: "Piassa", pricePerDay: 7000, photos: ["/cars/volkswagen_id41.jpg", "/cars/volkswagen_id42.jpg"], description: "Spacious electric SUV with smooth, silent drive and a high seating position. A great pick for longer city days with its generous cabin and boot.", status: "approved", createdAt: ts(-65) }),
    mkCar({ id: "car_wuling", ownerId: "u_samuel", make: "Wuling", model: "Mini EV", year: 2023, transmission: "Automatic", seats: 4, fuel: "Electric", neighbourhood: "Gerji", pricePerDay: 1800, photos: ["/cars/wuling_mini_ev1.jpg", "/cars/wuling_mini_ev2.jpg"], description: "Tiny city electric car that fits anywhere. Very low cost per day, ideal for short trips around Gerji and Bole when you do not need highway range.", status: "pending", createdAt: ts(-2) }),
  ];

  const priceOf = (id) => cars.find((c) => c.id === id).pricePerDay;
  const ownerOf = (id) => cars.find((c) => c.id === id).ownerId;
  const PATHS = {
    requested: ["requested"],
    confirmed: ["requested", "confirmed"],
    in_progress: ["requested", "confirmed", "in_progress"],
    completed: ["requested", "confirmed", "in_progress", "completed"],
    reviewed: ["requested", "confirmed", "in_progress", "completed", "reviewed"],
    declined: ["requested", "declined"],
    cancelled: ["requested", "cancelled"],
    disputed: ["requested", "confirmed", "in_progress", "disputed"],
    resolved: ["requested", "confirmed", "in_progress", "disputed", "resolved"],
  };
  const PAYMENT = { requested: "held", confirmed: "held", in_progress: "held", disputed: "held", declined: "refunded", cancelled: "refunded" };

  const mkBooking = (n, carId, renterId, startOff, days, status) => {
    const startDate = d(startOff);
    const endDate = d(startOff + days - 1);
    const p = computePricing(priceOf(carId), days);
    const created = ts(startOff - 5, 8);
    const history = PATHS[status].map((s, i) => ({
      status: s,
      at: new Date(new Date(created).getTime() + i * 3600000 * 6).toISOString(),
      by: i === 0 ? renterId : ownerOf(carId),
    }));
    return {
      id: `bk_${String(n).padStart(3, "0")}`,
      carId,
      renterId,
      ownerId: ownerOf(carId),
      startDate,
      endDate,
      days,
      ...p,
      paymentStatus: PAYMENT[status] || "paid",
      paymentMethod: "TeleBirr",
      paymentRef: `SW-TB-${String(n).padStart(4, "0")}`,
      status,
      createdAt: created,
      updatedAt: history[history.length - 1].at,
      statusHistory: history,
    };
  };

  const bookings = [
    mkBooking(1, "car_corolla", "u_meron", -40, 3, "reviewed"),
    mkBooking(2, "car_tucson", "u_meron", -20, 2, "completed"),
    mkBooking(3, "car_atto3", "u_meron", 6, 3, "confirmed"),
    mkBooking(4, "car_sportage", "u_meron", 12, 2, "requested"),
    mkBooking(5, "car_seagull", "u_meron", -10, 2, "cancelled"),
    mkBooking(6, "car_id4", "u_yonas", -30, 4, "reviewed"),
    mkBooking(7, "car_tucson", "u_yonas", 20, 4, "confirmed"),
    mkBooking(8, "car_corolla", "u_yonas", -1, 3, "in_progress"),
    mkBooking(9, "car_sportage", "u_yonas", -15, 2, "disputed"),
    mkBooking(10, "car_atto3", "u_yonas", 2, 2, "declined"),
    mkBooking(11, "car_id4", "u_meron", -50, 3, "resolved"),
    mkBooking(12, "car_tesla", "u_yonas", -45, 2, "reviewed"),
  ];

  const reviews = [
    { id: "rv_001", bookingId: "bk_001", carId: "car_corolla", renterId: "u_meron", ownerId: "u_dawit", rating: 5, comment: "Clean car and a smooth handover in Bole. Very fuel-efficient for city traffic.", ownerReply: "Thank you Meron, you are welcome back anytime!", createdAt: ts(-37) },
    { id: "rv_002", bookingId: "bk_006", carId: "car_id4", renterId: "u_yonas", ownerId: "u_samuel", rating: 4, comment: "Silent and comfortable in Addis traffic. Charging needed a little planning.", ownerReply: "", createdAt: ts(-26) },
    { id: "rv_003", bookingId: "bk_012", carId: "car_tesla", renterId: "u_yonas", ownerId: "u_hanna", rating: 5, comment: "Fast, quiet and spotless. The pickup walkthrough was really helpful.", ownerReply: "", createdAt: ts(-43) },
  ];

  const disputes = [
    { id: "dp_001", bookingId: "bk_009", openedBy: "u_yonas", reason: "Vehicle condition", description: "A dashboard warning light stayed on for most of the trip and I would like this noted.", status: "open", resolutionNotes: "", resolvedBy: null, createdAt: ts(-14), resolvedAt: null, messages: [{ by: "u_hanna", text: "The light is a known tyre-pressure sensor fault. I can share the service record.", at: ts(-13) }] },
    { id: "dp_002", bookingId: "bk_011", openedBy: "u_samuel", reason: "Late return", description: "The vehicle was returned about four hours after the agreed time.", status: "resolved", resolutionNotes: "Renter confirmed traffic delay. Owner accepted a one-time courtesy; no extra charge applied.", resolvedBy: "u_admin", createdAt: ts(-48), resolvedAt: ts(-46), messages: [] },
  ];

  const announcements = [
    { id: "an_001", title: "Welcome to Sheggar Wheels", message: "Browse cars across Addis Ababa, request a trip and manage your bookings in one place.", active: true, createdAt: ts(-5), createdBy: "u_admin" },
    { id: "an_002", title: "Scheduled maintenance", message: "An older announcement that has been deactivated.", active: false, createdAt: ts(-30), createdBy: "u_admin" },
  ];

  return { users, cars, bookings, reviews, disputes, announcements };
}

export function findSeedCar(id) {
  return buildSeed().cars.find((c) => c.id === id) || null;
}
