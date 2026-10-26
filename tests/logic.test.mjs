import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { freshBrowser } from "./setup.mjs";

freshBrowser();
const data = await import("../lib/data.js");
const session = await import("../lib/session.js");
const bookingsLib = await import("../lib/bookings.js");
const carsLib = await import("../lib/cars.js");
const reviewsLib = await import("../lib/reviews.js");
const disputesLib = await import("../lib/disputes.js");
const adminLib = await import("../lib/admin.js");
const usersLib = await import("../lib/users.js");
const catalogue = await import("../lib/catalogue.js");
const metrics = await import("../lib/metrics.js");
const reports = await import("../lib/reports.js");
const csv = await import("../lib/csv.js");
const storage = await import("../lib/storage.js");
const dates = await import("../lib/dates.js");
const fmt = await import("../lib/format.js");
const neg = await import("../lib/negativeTests.js");
const notifs = await import("../lib/notifications.js");
const { buildSeed } = await import("../lib/seed.js");

const T = dates.todayISO();
const d = (n) => dates.addDays(T, n);
beforeEach(() => { freshBrowser(); data.initializeDemoData(); });
const as = (id) => { const r = session.signInAsDemo(id); assert.ok(r.ok, r.error); };

test("seed data: 8+ cars, varied statuses, roles, bookings in every state", () => {
  const s = buildSeed();
  assert.ok(s.cars.length >= 8);
  assert.ok(new Set(s.cars.map((c) => c.status)).size >= 3);
  assert.ok(s.cars.every((c) => c.photos.length >= 2), "every car has 2+ photos");
  const owners = s.cars.reduce((m, c) => ((m[c.ownerId] = (m[c.ownerId] || 0) + 1), m), {});
  assert.ok(Object.values(owners).some((n) => n > 1), "owner with multiple cars");
  assert.ok(s.users.some((u) => u.roles.includes("admin")));
  const statuses = new Set(s.bookings.map((b) => b.status));
  for (const st of ["requested", "confirmed", "completed", "cancelled", "in_progress", "disputed", "resolved", "reviewed", "declined"]) assert.ok(statuses.has(st), st);
});

test("initializeDemoData never overwrites existing data", () => {
  as("u_meron");
  const before = data.getCars().length;
  carsLib.saveCarListing({ make: "Suzuki", model: "Dzire", year: 2020, transmission: "Manual", fuel: "Petrol", seats: 5, neighbourhood: "Bole", pricePerDay: 2500, description: "A neat and tidy compact sedan.", photos: ["/cars/toyota_vitz1.jpg"], latitude: 9, longitude: 38.7 });
  // meron is renter only -> refused
  assert.equal(data.getCars().length, before);
  data.initializeDemoData();
  assert.equal(data.getCars().length, before);
});

test("malformed JSON does not crash and is reported", () => {
  window.localStorage.setItem("sw_cars_v1", "{not json");
  assert.deepEqual(data.getCars(), []);
  const health = storage.getStorageHealth();
  assert.ok(health.issues.includes("sw_cars_v1"));
  window.localStorage.setItem("sw_cars_v1", JSON.stringify({ oops: 1 }));
  assert.deepEqual(data.getCars(), []);
  window.localStorage.setItem("sw_users_v1", JSON.stringify([null, 5, { id: "x" }]));
  assert.equal(data.getUsers().length, 1);
  data.resetDemoData();
  assert.ok(data.getCars().length >= 8);
  assert.equal(storage.getStorageHealth().issues.length, 0);
});

test("NEGATIVE 1: signed-out booking is refused", () => {
  const before = JSON.stringify(data.getBookings());
  const r = bookingsLib.createBookingRequest({ carId: "car_tucson", startDate: d(3), endDate: d(4) });
  assert.equal(r.ok, false);
  assert.equal(r.error, "Not signed in");
  assert.equal(JSON.stringify(data.getBookings()), before);
});

test("NEGATIVE 2: cancelling someone else's booking says 'Not yours' and changes nothing", () => {
  as("u_yonas");
  const before = JSON.stringify(data.getBookings());
  const r = bookingsLib.cancelBooking("bk_004"); // belongs to Meron
  assert.equal(r.error, "Not yours");
  assert.equal(JSON.stringify(data.getBookings()), before);
  assert.equal(bookingsLib.getBookingForRenter("bk_004").error, "Not yours");
});

test("NEGATIVE 3: safeReturnPath rejects external / tricky URLs", () => {
  const bad = ["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)", "/%2F%2Fexample.com", "http:/example.com", "", null, undefined, 5, "/\nfoo", "/%0d%0aSet-Cookie:x", "example.com", "/signin?next=/x"];
  for (const b of bad) assert.equal(session.safeReturnPath(b), "/", String(b));
  assert.equal(session.safeReturnPath("/cars/car_tucson?from=2030-01-01"), "/cars/car_tucson?from=2030-01-01");
  assert.equal(session.safeReturnPath("/bookings"), "/bookings");
});

test("owner cannot edit another owner's car", () => {
  as("u_hanna");
  const car = data.getCars().find((c) => c.id === "car_tucson");
  const r = carsLib.saveCarListing({ ...car }, { carId: car.id });
  assert.equal(r.error, "Not yours");
  assert.equal(carsLib.setCarActive("car_tucson", false).error, "Not yours");
  assert.equal(carsLib.setUnavailableDates("car_tucson", [d(5)]).error, "Not yours");
  assert.equal(carsLib.getOwnerCar("car_tucson").error, "Not yours");
});

test("renter-only account cannot use owner or admin actions; admin role cannot be self-assigned", () => {
  as("u_meron");
  assert.equal(carsLib.saveCarListing({}).error, "Not allowed for your role");
  assert.equal(adminLib.moderateCar("car_wuling", "approve").error, "Not allowed for your role");
  const up = usersLib.enableOwnerRole();
  assert.ok(up.ok);
  assert.deepEqual(session.getCurrentSession().user.roles, ["renter", "owner"]);
  assert.ok(!session.getCurrentSession().user.roles.includes("admin"));
  const acct = usersLib.createDemoAccount({ name: "Test User", email: "test@x.com", alsoOwner: true, roles: ["admin"] });
  assert.ok(acct.ok);
  assert.ok(!acct.data.roles.includes("admin"));
});

test("sign-up validation: duplicate email, bad email, missing fields", () => {
  assert.equal(usersLib.createDemoAccount({ name: "A", email: "meron@example.com" }).ok, false);
  assert.ok(usersLib.createDemoAccount({ name: "Abel Tadesse", email: "MERON@example.com" }).errors.email);
  assert.ok(usersLib.createDemoAccount({ name: "Abel Tadesse", email: "nope" }).errors.email);
  assert.ok(usersLib.createDemoAccount({ name: "", email: "" }).errors.name);
  assert.ok(usersLib.createDemoAccount({ name: "Abel Tadesse", email: "abel@x.com", phone: "123" }).errors.phone);
  assert.ok(session.signInWithEmail("nobody@x.com").error);
  assert.ok(session.signInWithEmail("meron@example.com").ok);
});

test("booking: totals, snapshot price, validation", () => {
  as("u_meron");
  const bad = [
    { carId: "car_tucson", startDate: d(-1), endDate: d(1) },
    { carId: "car_tucson", startDate: d(5), endDate: d(3) },
    { carId: "car_tucson", startDate: "nope", endDate: d(3) },
    { carId: "car_tucson", startDate: d(1), endDate: d(60) },
    { carId: "car_wuling", startDate: d(5), endDate: d(6) }, // pending
    { carId: "car_vitz", startDate: d(5), endDate: d(6) }, // rejected
    { carId: "nope", startDate: d(5), endDate: d(6) },
    { carId: "car_tucson", startDate: d(30), endDate: d(31) }, // owner blocked
  ];
  for (const b of bad) assert.equal(bookingsLib.createBookingRequest(b).ok, false, JSON.stringify(b));
  const r = bookingsLib.createBookingRequest({ carId: "car_tucson", startDate: d(5), endDate: d(7) });
  assert.ok(r.ok, r.error);
  assert.equal(r.data.days, 3);
  assert.equal(r.data.subtotal, 15600);
  assert.equal(r.data.fee, 1560);
  assert.equal(r.data.total, 17160);
  assert.equal(r.data.status, "requested");
  assert.match(r.data.paymentRef, /^SW-TB-/);
  // duplicate pending request
  assert.equal(bookingsLib.createBookingRequest({ carId: "car_tucson", startDate: d(6), endDate: d(8) }).ok, false);
  // price snapshot survives price change
  session.signOut(); as("u_dawit");
  const car = data.getCars().find((c) => c.id === "car_tucson");
  assert.ok(carsLib.saveCarListing({ ...car, pricePerDay: 9999 }, { carId: car.id }).ok);
  assert.equal(data.getBookings().find((b) => b.id === r.data.id).pricePerDay, 5200);
  // owner can't rent own car
  assert.equal(bookingsLib.createBookingRequest({ carId: "car_tucson", startDate: d(40), endDate: d(41) }).ok, false);
});

test("two overlapping bookings for one car cannot both be confirmed", () => {
  as("u_meron");
  const a = bookingsLib.createBookingRequest({ carId: "car_sportage", startDate: d(40), endDate: d(42) });
  assert.ok(a.ok);
  session.signOut(); as("u_yonas");
  const b = bookingsLib.createBookingRequest({ carId: "car_sportage", startDate: d(41), endDate: d(43) });
  assert.ok(b.ok, "requests may overlap while pending");
  session.signOut(); as("u_hanna");
  assert.ok(bookingsLib.approveBooking(a.data.id).ok);
  const second = bookingsLib.approveBooking(b.data.id);
  assert.equal(second.ok, false);
  assert.match(second.error, /overlap/);
  assert.equal(data.getBookings().find((x) => x.id === b.data.id).status, "requested");
  // and a new request on confirmed dates is refused up front
  session.signOut(); as("u_yonas");
  assert.equal(bookingsLib.createBookingRequest({ carId: "car_sportage", startDate: d(42), endDate: d(44) }).ok, false);
});

test("full lifecycle: request -> confirmed -> in_progress -> completed -> reviewed", () => {
  as("u_meron");
  const r = bookingsLib.createBookingRequest({ carId: "car_corolla", startDate: d(50), endDate: d(51) });
  const id = r.data.id;
  assert.equal(bookingsLib.startRental(id).error, "Not yours"); // renter can't start
  session.signOut(); as("u_dawit");
  assert.equal(bookingsLib.startRental(id).ok, false); // invalid from requested
  assert.equal(bookingsLib.approveBooking(id).data.status, "confirmed");
  assert.equal(bookingsLib.approveBooking(id).ok, false); // can't approve twice
  assert.equal(bookingsLib.startRental(id).data.status, "in_progress");
  assert.equal(bookingsLib.completeRental(id).data.paymentStatus, "paid");
  session.signOut(); as("u_meron");
  assert.equal(reviewsLib.submitReview({ bookingId: id, rating: 6, comment: "Great trip overall" }).ok, false);
  assert.equal(reviewsLib.submitReview({ bookingId: id, rating: 5, comment: "short" }).ok, false);
  assert.ok(reviewsLib.submitReview({ bookingId: id, rating: 5, comment: "Excellent car and owner." }).ok);
  assert.equal(data.getBookings().find((b) => b.id === id).status, "reviewed");
  assert.equal(reviewsLib.submitReview({ bookingId: id, rating: 5, comment: "Excellent car and owner." }).ok, false, "one review per booking");
  assert.equal(bookingsLib.cancelBooking(id).ok, false, "terminal");
  // history trail
  assert.deepEqual(data.getBookings().find((b) => b.id === id).statusHistory.map((h) => h.status), ["requested", "confirmed", "in_progress", "completed", "reviewed"]);
});

test("only the booking's renter reviews; only the car's owner replies", () => {
  as("u_yonas");
  assert.equal(reviewsLib.submitReview({ bookingId: "bk_002", rating: 5, comment: "Trying to review someone else's trip" }).error, "Not yours");
  session.signOut(); as("u_meron");
  assert.ok(reviewsLib.submitReview({ bookingId: "bk_002", rating: 4, comment: "Solid SUV, smooth pickup." }).ok);
  const review = data.getReviews().find((r) => r.bookingId === "bk_002");
  session.signOut(); as("u_hanna");
  assert.equal(reviewsLib.replyToReview(review.id, "Thanks!").error, "Not yours");
  session.signOut(); as("u_dawit");
  assert.ok(reviewsLib.replyToReview(review.id, "Thanks Meron!").ok);
});

test("cancel rules: renter only, confirmed only before start date", () => {
  as("u_meron");
  assert.equal(bookingsLib.cancelBooking("bk_003").data.status, "cancelled"); // confirmed, in future
  assert.equal(data.getBookings().find((b) => b.id === "bk_003").paymentStatus, "refunded");
  assert.equal(bookingsLib.cancelBooking("bk_002").ok, false); // completed
  session.signOut(); as("u_yonas");
  assert.equal(bookingsLib.cancelBooking("bk_008").ok, false); // in progress
  // confirmed booking whose start date arrived
  const list = data.getBookings();
  const target = list.find((b) => b.id === "bk_007");
  const raw = JSON.parse(window.localStorage.getItem("sw_bookings_v1"));
  raw.find((b) => b.id === "bk_007").startDate = T;
  raw.find((b) => b.id === "bk_007").endDate = d(2);
  window.localStorage.setItem("sw_bookings_v1", JSON.stringify(raw));
  assert.match(bookingsLib.cancelBooking(target.id).error, /Too late/);
});

test("owner approve/decline only their own requests", () => {
  as("u_dawit");
  assert.equal(bookingsLib.approveBooking("bk_004").error, "Not yours"); // Hanna's car
  session.signOut(); as("u_hanna");
  assert.equal(bookingsLib.declineBooking("bk_004").data.status, "declined");
  assert.equal(data.getBookings().find((b) => b.id === "bk_004").paymentStatus, "refunded");
});

test("lifecycle table is complete and terminal states are terminal", () => {
  for (const s of ["reviewed", "declined", "cancelled", "resolved"]) assert.deepEqual(bookingsLib.TRANSITIONS[s], {});
  assert.equal(Object.keys(bookingsLib.TRANSITIONS).length, 9);
  const u = { id: "u_meron", roles: ["renter"], status: "active" };
  const b = data.getBookings().find((x) => x.id === "bk_004");
  assert.deepEqual(bookingsLib.getAllowedActions(b, u, T), ["cancel"]);
  assert.deepEqual(bookingsLib.getAllowedActions(b, { ...u, status: "suspended" }, T), []);
});

test("disputes: party opens during in_progress; admin resolves with notes", () => {
  as("u_meron");
  assert.equal(disputesLib.openDispute({ bookingId: "bk_008", reason: "Late return", description: "Not my booking at all" }).error, "Not yours");
  session.signOut(); as("u_yonas");
  assert.equal(disputesLib.openDispute({ bookingId: "bk_007", reason: "Late return", description: "Valid description here" }).ok, false); // confirmed
  assert.equal(disputesLib.openDispute({ bookingId: "bk_008", reason: "Nope", description: "Valid description here" }).ok, false);
  const r = disputesLib.openDispute({ bookingId: "bk_008", reason: "Cleanliness", description: "The interior was not clean." });
  assert.ok(r.ok);
  assert.equal(data.getBookings().find((b) => b.id === "bk_008").status, "disputed");
  assert.equal(disputesLib.getDisputeForUser("dp_002").error, "Not yours");
  assert.ok(disputesLib.listDisputesForUser().every((x) => ["dp_001", r.data.id].includes(x.id)));
  assert.equal(disputesLib.resolveDispute(r.data.id, "I am not an admin at all").error, "Not allowed for your role");
  session.signOut(); as("u_admin");
  assert.equal(disputesLib.resolveDispute(r.data.id, "short").ok, false);
  assert.ok(disputesLib.resolveDispute(r.data.id, "Both parties agreed; cleaning fee waived.").ok);
  assert.equal(data.getBookings().find((b) => b.id === "bk_008").status, "resolved");
  assert.equal(disputesLib.resolveDispute(r.data.id, "Resolve again please ok").ok, false);
});

test("admin: listing moderation, suspension hides cars and blocks actions", () => {
  as("u_admin");
  assert.equal(adminLib.moderateCar("car_wuling", "reject", "no").ok, false);
  assert.ok(adminLib.moderateCar("car_wuling", "approve").ok);
  assert.equal(adminLib.moderateCar("car_wuling", "approve").ok, false);
  assert.ok(carsLib.getPublicCars().some((c) => c.id === "car_wuling"));
  assert.equal(adminLib.setUserStatus("u_admin", "suspended").ok, false);
  assert.ok(adminLib.setUserStatus("u_samuel", "suspended").ok);
  assert.ok(!carsLib.getPublicCars().some((c) => c.ownerId === "u_samuel"), "suspended owner's cars hidden");
  session.signOut(); as("u_samuel");
  assert.equal(carsLib.saveCarListing({}).error, "Account suspended");
  assert.equal(bookingsLib.approveBooking("bk_004").error, "Account suspended");
  session.signOut(); as("u_kebede");
  assert.equal(bookingsLib.createBookingRequest({ carId: "car_tucson", startDate: d(5), endDate: d(6) }).error, "Account suspended");
  session.signOut(); as("u_admin");
  assert.ok(adminLib.setUserStatus("u_samuel", "active").ok);
  assert.ok(carsLib.getPublicCars().some((c) => c.id === "car_id4"));
});

test("public catalogue hides pending, rejected, inactive", () => {
  const ids = carsLib.getPublicCars().map((c) => c.id);
  assert.ok(!ids.includes("car_wuling") && !ids.includes("car_vitz"));
  assert.equal(ids.length, 7);
  as("u_hanna");
  assert.ok(carsLib.setCarActive("car_seagull", false).ok);
  assert.ok(!carsLib.getPublicCars().some((c) => c.id === "car_seagull"));
  assert.equal(carsLib.setCarActive("car_seagull", false).ok, false);
  assert.equal(carsLib.setCarActive("car_seagull", true).data.status, "approved");
  assert.equal(carsLib.setCarActive("car_sportage", false).ok, true);
});

test("owner creates a listing -> pending; edit rejected -> pending again; validation", () => {
  as("u_dawit");
  const form = { make: "Suzuki", model: "Dzire", year: 2021, transmission: "Manual", fuel: "Petrol", seats: 5, neighbourhood: "Bole", pricePerDay: 2600, description: "A tidy and economical sedan for city driving.", photos: ["/cars/toyota_corolla1.jpg", "/cars/toyota_corolla2.jpg"], latitude: 8.99, longitude: 38.78 };
  const bad = carsLib.saveCarListing({ ...form, photos: [], pricePerDay: 10, year: 1800, description: "x" });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.photos && bad.errors.pricePerDay && bad.errors.year && bad.errors.description);
  assert.equal(carsLib.saveCarListing({ ...form, photos: ["http://evil.example/x.png"] }).ok, false);
  const made = carsLib.saveCarListing(form);
  assert.equal(made.data.status, "pending");
  assert.equal(carsLib.saveCarListing(form, { submit: false }).data.status, "draft");
  const resub = carsLib.saveCarListing({ ...data.getCars().find((c) => c.id === "car_vitz"), description: "A compact hatchback in great shape with a recent service." }, { carId: "car_vitz" });
  assert.equal(resub.data.status, "pending");
  assert.equal(resub.data.rejectionReason, "");
});

test("availability: owner blocks dates, bookings respect them", () => {
  as("u_hanna");
  assert.ok(carsLib.setUnavailableDates("car_tesla", [d(10), d(11), d(10)]).ok);
  assert.deepEqual(data.getCars().find((c) => c.id === "car_tesla").unavailableDates, [d(10), d(11)]);
  assert.equal(carsLib.setUnavailableDates("car_tesla", ["junk"]).ok, false);
  session.signOut(); as("u_meron");
  assert.equal(bookingsLib.createBookingRequest({ carId: "car_tesla", startDate: d(9), endDate: d(10) }).ok, false);
  assert.ok(bookingsLib.createBookingRequest({ carId: "car_tesla", startDate: d(12), endDate: d(12) }).ok);
});

test("catalogue: search, filters, sorting, pagination clamp, availability", () => {
  const cars = carsLib.getPublicCars();
  const bookings = data.getBookings();
  const P = (s) => catalogue.parseFilters(new URLSearchParams(s));
  assert.equal(catalogue.filterCars(cars, P("q=TUCSON"), bookings).length, 1);
  assert.equal(catalogue.filterCars(cars, P("q=nothingmatches"), bookings).length, 0);
  assert.ok(catalogue.filterCars(cars, P("neighbourhood=Bole"), bookings).every((c) => c.neighbourhood === "Bole"));
  assert.ok(catalogue.filterCars(cars, P("minPrice=5000&maxPrice=6500"), bookings).every((c) => c.pricePerDay >= 5000 && c.pricePerDay <= 6500));
  assert.ok(catalogue.filterCars(cars, P("transmission=Manual"), bookings).every((c) => c.transmission === "Manual"));
  assert.ok(catalogue.filterCars(cars, P("seats=5"), bookings).every((c) => c.seats >= 5));
  const asc = catalogue.sortCars(cars, "price-asc").map((c) => c.pricePerDay);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  const desc = catalogue.sortCars(cars, "price-desc").map((c) => c.pricePerDay);
  assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
  assert.equal(catalogue.sortCars(cars, "newest")[0].createdAt >= catalogue.sortCars(cars, "newest")[1].createdAt, true);
  assert.ok(catalogue.sortCars(cars, "popular", bookings).length === cars.length);
  const p1 = catalogue.paginate(cars, 1);
  assert.equal(p1.items.length, 6); assert.equal(p1.totalPages, 2);
  assert.equal(catalogue.paginate(cars, 99).page, 2, "clamped");
  assert.equal(catalogue.paginate([], 5).page, 1);
  // availability: Tucson blocked days d(30..32), booking bk_007 d(20..23)
  const avail = catalogue.filterCars(cars, P(`from=${d(21)}&to=${d(22)}`), bookings).map((c) => c.id);
  assert.ok(!avail.includes("car_tucson"));
  assert.ok(!catalogue.filterCars(cars, P(`from=${d(31)}`), bookings).some((c) => c.id === "car_tucson"));
  assert.ok(catalogue.filterCars(cars, P(`from=${d(100)}&to=${d(101)}`), bookings).some((c) => c.id === "car_tucson"));
  // URL round trip & junk input
  const f = P("q=kia&sort=price-asc&page=3&minPrice=abc&seats=-4&from=garbage&sort2=x");
  assert.equal(f.minPrice, null); assert.equal(f.seats, null); assert.equal(f.from, ""); assert.equal(f.page, 3);
  assert.equal(catalogue.filtersToQuery({ ...f, page: 1 }), "q=kia&sort=price-asc");
});

test("CSV quoting: commas, quotes, newlines, formulas", () => {
  assert.equal(csv.csvEscape("plain"), "plain");
  assert.equal(csv.csvEscape("a,b"), '"a,b"');
  assert.equal(csv.csvEscape('say "hi"'), '"say ""hi"""');
  assert.equal(csv.csvEscape("line1\nline2"), '"line1\nline2"');
  assert.equal(csv.csvEscape("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(csv.csvEscape(-5), "-5");
  assert.equal(csv.csvEscape(null), "");
  const out = csv.toCSV([{ n: 'A "x", y' }], [{ header: "Name", value: (r) => r.n }]);
  assert.equal(out, 'Name\r\n"A ""x"", y"\r\n');
});

test("CSV exports contain only the signed-in user's permitted data", () => {
  assert.equal(reports.exportRenterBookingsCsv().error, "Not signed in");
  as("u_meron");
  const mine = reports.exportRenterBookingsCsv().data.csv;
  assert.ok(mine.includes("bk_001") && !mine.includes("bk_006"));
  assert.equal(reports.exportOwnerBookingsCsv().error, "Not allowed for your role");
  assert.equal(reports.exportAdminReportCsv("bookings").error, "Not allowed for your role");
  session.signOut(); as("u_dawit");
  const own = reports.exportOwnerBookingsCsv().data.csv;
  assert.ok(own.includes("bk_001") && !own.includes("bk_004"));
  session.signOut(); as("u_admin");
  for (const k of ["bookings", "listings", "users", "summary"]) assert.ok(reports.exportAdminReportCsv(k).ok, k);
  assert.ok(reports.exportAdminReportCsv("bookings").data.csv.includes("bk_012"));
});

test("metrics: renter, owner, admin", () => {
  const all = data.getBookings();
  const rm = metrics.renterMetrics(all.filter((b) => b.renterId === "u_meron"), T);
  assert.equal(rm.upcoming, 2); assert.equal(rm.completed, 3); assert.equal(rm.cancelled, 1);
  assert.equal(rm.next.id, "bk_003");
  const om = metrics.ownerMetrics(data.getCars().filter((c) => c.ownerId === "u_dawit"), all.filter((b) => b.ownerId === "u_dawit"), T);
  assert.equal(om.approvedCars, 3);
  assert.equal(om.byMonth.length, 6);
  assert.ok(om.totalEarnings > 0);
  assert.equal(om.byMonth.reduce((s, m) => s + m.earnings, 0) <= om.totalEarnings, true);
  assert.ok(om.perCar.every((p) => p.utilization >= 0 && p.utilization <= 100));
  const am = metrics.adminMetrics(data.getUsers(), data.getCars(), all, T);
  assert.equal(am.totalUsers, 7); assert.equal(am.activeUsers, 6); assert.equal(am.approvedCars, 7); assert.equal(am.pendingCars, 1);
  assert.equal(am.platformFee, all.filter((b) => ["completed", "reviewed", "resolved"].includes(b.status)).reduce((s, b) => s + b.fee, 0));
  assert.equal(metrics.lastMonthKeys(3, "2026-02-10").join(), "2025-12,2026-01,2026-02");
});

test("dates + formatting helpers", () => {
  assert.equal(dates.addDays("2026-02-27", 2), "2026-03-01");
  assert.equal(dates.diffDays("2026-01-01", "2026-01-05"), 4);
  assert.equal(dates.isValidISODate("2026-02-30"), false);
  assert.equal(dates.isValidISODate("2026-02-28"), true);
  assert.equal(dates.overlapDays("2026-01-01", "2026-01-10", "2026-01-08", "2026-01-20"), 3);
  assert.equal(fmt.formatETB(1234567), "ETB 1,234,567");
  assert.equal(fmt.formatETB("abc"), "ETB 0");
  assert.equal(fmt.formatDate("2026-11-05"), "5 Nov 2026");
  assert.equal(fmt.formatDate(undefined), "-");
  assert.equal(fmt.formatRelative("2026-01-01T00:00:00Z", Date.parse("2026-01-04T00:00:00Z")), "3 days ago");
  assert.equal(fmt.formatRelative("2026-01-01T02:00:00Z", Date.parse("2026-01-01T00:00:00Z")), "in 2 hours");
  assert.equal(fmt.formatRelative("2026-01-01T00:00:10Z", Date.parse("2026-01-01T00:00:00Z")), "just now");
});

test("storage failures are handled gracefully", () => {
  const real = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = () => { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; };
  const r = storage.writeStorage("k", { a: 1 });
  assert.equal(r.ok, false); assert.match(r.error, /full/);
  window.localStorage.setItem = real;
  const gone = globalThis.window; delete globalThis.window;
  assert.equal(storage.readStorage("x", 7), 7);
  assert.equal(storage.writeStorage("x", 1).ok, false);
  globalThis.window = gone;
});

test("in-app negative-test runner passes and restores the session", () => {
  as("u_meron");
  const results = neg.runNegativeTests();
  assert.ok(results.length >= 5);
  for (const r of results) assert.ok(r.passed, `${r.title}: ${r.actual}`);
  assert.equal(session.getCurrentSession().userId, "u_meron");
  session.signOut();
  neg.runNegativeTests();
  assert.equal(session.getCurrentSession(), null);
});

test("notifications are derived from records per role", () => {
  const all = { cars: data.getCars(), bookings: data.getBookings(), disputes: data.getDisputes(), announcements: data.getAnnouncements() };
  const meron = data.getUsers().find((u) => u.id === "u_meron");
  assert.ok(notifs.buildNotifications(meron, all).some((n) => n.href === "/bookings/bk_003"));
  const hanna = data.getUsers().find((u) => u.id === "u_hanna");
  assert.ok(notifs.buildNotifications(hanna, all).some((n) => n.title === "New booking request"));
  const admin = data.getUsers().find((u) => u.id === "u_admin");
  const an = notifs.buildNotifications(admin, all);
  assert.ok(an.some((n) => n.title === "Listing awaiting review") && an.some((n) => n.title === "Open dispute"));
});

test("owner can read (and so track) bookings of their own cars only", () => {
  assert.equal(bookingsLib.getBookingForOwner("bk_008").error, "Not signed in");
  as("u_dawit");
  assert.equal(bookingsLib.getBookingForOwner("bk_008").data.status, "in_progress");
  assert.equal(bookingsLib.getBookingForOwner("bk_004").error, "Not yours"); // Hanna's car
  assert.equal(bookingsLib.getBookingForOwner("nope").error, "Booking not found.");
  session.signOut(); as("u_meron");
  assert.equal(bookingsLib.getBookingForOwner("bk_008").error, "Not allowed for your role");
});
