# AUTH – demo authentication

> **Everything here is a demonstration of frontend design. It is NOT security.** Browser storage is user-editable; anyone can open dev tools, change `sessionStorage`, and "become" an admin. Real enforcement needs a server (FUTURE.md). No passwords, payment credentials or secrets are stored anywhere.

## Session model

- `signInAsDemo(userId)` / `signInWithEmail(email)` write `{ userId, signedInAt, mode: "demo" }` to **sessionStorage** (`sw_session_v1`).
- `getCurrentSession()` reads that id and looks the user up in **localStorage** (`sw_users_v1`). A missing or malformed session means "signed out".
- `signOut()` clears `sw_session_v1`, the checkout draft and the notification flag, and the header navigates to `/`.
- Roles are an array: `roles: ['renter','owner']` (one account can be both). `admin` only exists on the seeded admin user; `createDemoAccount` can only produce `renter` or `renter + owner`.
- A `suspended` user can sign in but sees an **Access blocked** screen (`RoleGuard`), and every domain function returns `Account suspended` (so storage is never written).

Helpers (`lib/session.js`): `getCurrentSession`, `signInAsDemo`, `signOut`, `hasRole`, `requireRole`, `safeReturnPath` (plus `signInWithEmail`, `defaultLanding`).

## Protected routes (UI layer)

`RoleGuard` (inside `AppShell`) hides protected UI:

| Area | Required | If not satisfied |
|---|---|---|
| `/dashboard`, `/bookings…`, `/checkout` | signed in + `renter` | signed out → `/signin?next=<current path>`; wrong role → "no access" panel |
| `/owner…` (incl. `/owner/bookings/[id]/track`) | signed in + `owner` | a renter sees "Enable owner tools on my account" (adds `owner` to the *same* account) |
| `/admin…` | signed in + `admin` | explains that admin tools are for administrator accounts |

## Protected actions (the checks that matter)

Hiding UI is not enough, so **every action in `lib/*.js` repeats the checks** before writing: *session exists → account not suspended → expected role → record ownership → valid current state → input validation*. Ownership is checked **before** state/validation so another person's records are never described or changed.

| Action | Role | Ownership check | State check |
|---|---|---|---|
| `createBookingRequest` | renter | cannot book own car | car approved + owner active; dates valid; no conflict |
| `cancelBooking` | renter | `booking.renterId === me` → else **Not yours** | `requested`, or `confirmed` before start date |
| `approveBooking` / `declineBooking` / `startRental` / `completeRental` | owner | `booking.ownerId === me` | transition table; approve re-checks overlaps |
| `getBookingForRenter` | renter | `renterId === me` | – |
| `getBookingForOwner` (owner trip tracker) | owner | `ownerId === me` → else **Not yours** | tracker only for `in_progress` |
| `submitReview` | renter | own booking | `completed`, one review per booking |
| `replyToReview` | owner | `review.ownerId === me` | – |
| `openDispute` | renter/owner | party to the booking | `in_progress` |
| `getDisputeForUser` / `addDisputeMessage` | party or admin | party / admin | open for messages |
| `resolveDispute`, `moderateCar`, `setUserStatus`, `publishAnnouncement` | admin | – | pending / open etc. |
| `saveCarListing` (edit), `setCarActive`, `setUnavailableDates`, `getOwnerCar` | owner | `car.ownerId === me` → else **Not yours** | – |
| CSV exports (`lib/reports.js`) | per scope | only the signed-in user's rows | – |

The booking lifecycle is a finite table (`TRANSITIONS` in `lib/bookings.js`); anything else is refused without touching storage.

## Safe return path

`/signin?next=…` is passed through `safeReturnPath()`: must start with a single `/`, no `//` or `\`, no control characters, no external origin (checked with `new URL`), tested both raw and URL-decoded, max 500 chars, never `/signin` or `/signup` (no loops). Anything else becomes `/`. The sign-in page tells the user when a return address was ignored.

## The three required negative tests (+ extras)

Run them live at **`/guardrails`** (the page temporarily switches the signed-in account, tries the forbidden action through the same functions the buttons use, verifies storage did not change, then restores your session). They are also automated in `tests/logic.test.mjs`.

| # | Test | Expected |
|---|---|---|
| 1 | Call `createBookingRequest` with no session | `Not signed in`, no booking created |
| 2 | Signed in as one renter, `cancelBooking` on another renter's booking | `Not yours`, data unchanged |
| 3 | `/signin?next=https://example.com` (and `//example.com`, `/\example.com`, `javascript:`, encoded variants) | after sign-in the user lands on `/`, never the external site |
| extra | Renter opens another renter's booking (`getBookingForRenter`) | `Not yours` |
| extra | Owner edits another owner's car by changing the id (`saveCarListing`, `setCarActive`, `setUnavailableDates`, `getOwnerCar`) | `Not yours` |
| extra | Cancel a completed booking | refused, data unchanged |

## Limits (be honest in the demo)

- Anyone can edit `sw_*` keys in dev tools and sign in as anyone. These checks only prove the *UI and helper functions* handle ordinary misuse.
- Robots rules and `noindex` are crawler hints, not access control.
- Seed emails are public by design.
