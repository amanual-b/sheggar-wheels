# FUTURE – what was simulated, what was cut, what comes next

## Simulated (works today, not real)

| Feature | How it is simulated |
|---|---|
| Database | `localStorage` collections (`sw_*_v1`) seeded from `lib/seed.js` |
| Authentication | Pick a sample account; only a user id is kept in `sessionStorage`; no passwords |
| Authorization | Role + ownership + state checks in `lib/*.js`; bypassable by editing storage |
| Payments | "Confirm and pay" with TeleBirr as the method, fake `SW-TB-…` reference, `held → paid/refunded` labels. No credentials are collected |
| Locations / tracking | Seeded sample coordinates; the trip tracker moves a marker between five predefined points and is labelled **Simulation** |
| Notifications | Derived from booking/dispute records (no push, no SSE). Admin announcements appear here (there is no announcement bar) |
| Photos | Owners choose from a built-in photo library instead of uploading files |
| "Real-time" | Re-reading storage after writes, plus the browser `storage` event between tabs |

## Cut / simplified on purpose

- Route Handlers, Server Actions, ISR/revalidation – nothing server-side to call or revalidate.
- Dynamic Open Graph images (`next/og`). Share images are pre-rendered files in `public/og/` for the seeded cars; cars created in the browser use `default.jpg`.
- Date gating for "Start rental" (so reviewers can finish a lifecycle in one sitting).
- Admin moderation of reviews; pricing/ cancellation policies; multi-day-time-of-day rentals.
- Editing an *approved* listing does not send it back for review.
- Automated browser (E2E) tests and in-repo Lighthouse CI.
- Real screenshots and Lighthouse numbers (README/PERF contain placeholders to fill).

## Must move to a backend

1. **Database + API** (Route Handlers / separate service) replacing `lib/data.js`; keep the domain functions as the API contract.
2. **Real authentication**: password hashing or OAuth, HTTP-only cookie sessions, CSRF protection; server-side role and ownership checks on every request.
3. **Conflict-safe bookings**: database transaction/constraint so two renters can never confirm overlapping dates; server-side date and price calculation.
4. **Payments**: a licensed provider (TeleBirr / card) with webhooks, escrow rules, refunds, PCI/compliance handled by the provider.
5. **Notifications**: email/SMS, background jobs, and SSE or WebSockets for live updates.
6. **Trust & safety**: verified identity and driving licences, vehicle documents, insurance, deposits, cancellation policies, audit logs, a proper dispute workflow.
7. **Real GPS tracking** only with explicit consent, privacy controls and legal review.
8. **File uploads** for car photos with validation and an image CDN.

## Prioritised next steps

1. Run `npm install && npm run build`
