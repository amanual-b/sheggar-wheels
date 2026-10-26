# DATA – entities, storage keys and data flow

Records are plain JavaScript objects with stable ids (`crypto.randomUUID()` with a small fallback, see `lib/ids.js`; seed ids are readable, e.g. `car_tucson`, `bk_003`). Dates are `YYYY-MM-DD`; timestamps are ISO date-times.

## Storage keys

| Key | Storage | Contents |
|---|---|---|
| `sw_users_v1` | localStorage | users: role(s) and status |
| `sw_cars_v1` | localStorage | listings and moderation status |
| `sw_bookings_v1` | localStorage | bookings and lifecycle status |
| `sw_reviews_v1` | localStorage | reviews and owner replies |
| `sw_disputes_v1` | localStorage | disputes, messages, resolution notes |
| `sw_announcements_v1` | localStorage | admin announcements |
| `sw_session_v1` | **sessionStorage** | `{ userId, signedInAt, mode }` |
| `sw_checkout_draft_v1` | **sessionStorage** | `{ carId, startDate, endDate, createdAt }` |
| `sw_notif_seen_v1` | **sessionStorage** | timestamp of last notification-panel open (one-time UI flag) |

## Entities

**User** `id, name, email, phone, roles[], status ('active'|'suspended'), createdAt` – email unique (case-insensitive); no password is ever stored.

**Car** `id, ownerId, make, model, year, transmission, seats, city, neighbourhood, latitude, longitude, pricePerDay, photos[], description, status, unavailableDates[], createdAt` + extras `fuel, wasApproved, rejectionReason`. `status`: `draft | pending | approved | rejected | inactive`. Public only if `approved` **and** the owner is not suspended.

**Booking** `id, carId, renterId, ownerId, startDate, endDate, days, pricePerDay, subtotal, fee, total, paymentStatus, status, createdAt, updatedAt` + extras `paymentMethod, paymentRef, statusHistory[]`. The price is **snapshotted** at request time. Rental days are inclusive (`days = end − start + 1`). `fee = round(10% × subtotal)`, `total = subtotal + fee`; the owner earns `subtotal`, the platform "commission" is `fee`. `paymentStatus`: `held` at checkout → `paid` on completion/resolution, `refunded` on decline/cancel. Statuses and transitions are in `TRANSITIONS` (`lib/bookings.js`) and match section 7 of the brief.

**Review** `id, bookingId, carId, renterId, ownerId, rating (1–5), comment, ownerReply, createdAt` – one per booking, only for the booking's renter once `completed`.

**Dispute** `id, bookingId, openedBy, reason, description, status ('open'|'resolved'), resolutionNotes, resolvedBy, createdAt, resolvedAt` + extra `messages[]`. Only parties to the booking (and admin) can read it; admin resolves it, which moves the booking `disputed → resolved`.

**Announcement** `id, title, message, active, createdAt, createdBy` – admin only.

## Helper functions

| Module | Functions |
|---|---|
| `lib/storage.js` | `readStorage(key, fallback, {session, validate})`, `writeStorage(key, value, {session})`, `removeStorage`, `isStorageAvailable`, `getStorageHealth` |
| `lib/data.js` | `initializeDemoData()`, `resetDemoData()`, `getUsers/Cars/Bookings/Reviews/Disputes/Announcements()`, `getCarById`, `getUserById`, `saveUser/Car/Booking/Review/Dispute/Announcement()` |
| `lib/session.js` | session + role helpers (AUTH.md) |
| `lib/hooks.js` | SWR hooks (`useData`, `useSession`, role-scoped lists) and `refreshData()` |
| domain | `bookings.js`, `cars.js`, `reviews.js`, `disputes.js`, `admin.js`, `users.js` |
| derived | `catalogue.js` (filter/sort/paginate), `metrics.js`, `notifications.js`, `reports.js` + `csv.js`, `format.js`, `dates.js` |

## Data flow

```
 page component ──calls──▶ domain function (lib/bookings.js …)
                              │ 1 requireRole / session
                              │ 2 ownership + state + validation
                              ▼
                        saveBooking()  ──▶ writeStorage() ──▶ localStorage
 page component ◀── SWR re-reads via getBookings() ◀── refreshData() after every write
```

## Seeding

`initializeDemoData()` writes a collection **only if its key is absent**; it never overwrites user data on refresh. `resetDemoData()` (button on `/guardrails`, behind a confirm dialog; also offered in the storage-recovery banner) removes every key and reseeds. The seed has 9 cars (7 approved, 1 pending, 1 rejected) with 2 real photos each, 7 users (3 owners, 2 renters with history, 1 admin, 1 suspended) and 12 bookings covering every status. Seed dates are relative to the seeding day.

## Validation rules (highlights)

- Booking: valid ISO dates, end ≥ start, start ≥ today, max 30 days, car approved and owner active, not your own car, no overlap with owner-blocked dates or `confirmed`/`in_progress` bookings, no duplicate pending request. Two overlapping *requests* may coexist, but only one can be **confirmed** (approval re-checks).
- Listing: make/model, year 1995–next year, seats 2–9, price ETB 500–50,000, description 30–800 chars, 1–6 photos from the built-in photo library, coordinates near Addis Ababa.
- Sign-up: name ≥ 2, valid unique email, optional Ethiopian mobile number.
- Review 10–600 chars; reply ≤ 400; dispute description 10–600; resolution notes ≥ 10.
- CSV: fields containing commas, quotes or newlines are quoted (`"` doubled); strings beginning with `= + - @` are prefixed with `'` to stop spreadsheet formula injection.

## Recovery behaviour

- Missing key → seeded (first run) or empty list.
- **Malformed JSON, or JSON that is not an array** → the reader returns an empty list instead of crashing; `StorageHealth` shows a warning naming the key with a **Reset saved data** button.
- Records that are not objects with a string `id` are dropped; missing fields are normalised (`photos`, `roles`, numbers).
- Storage unavailable (private mode) → clear error banner; writes return `{ ok:false, error }`.
- Quota exceeded → `writeStorage` returns a friendly error; actions surface it as a toast.
