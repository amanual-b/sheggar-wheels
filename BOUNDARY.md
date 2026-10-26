# BOUNDARY – Server Components vs Client Components

`localStorage` and `sessionStorage` only exist in the browser. Server code can never read them. So the boundary is drawn like this:

> **Servers render the shell, metadata and static content. Anything that reads or writes browser storage, or reacts to the user, is a Client Component.**

## Server Components (no `"use client"`)

| File | Role |
|---|---|
| `app/layout.js` | `<html>`, font (`next/font`), global metadata, `<Providers>` |
| `app/(public)/layout.js`, `(renter)/layout.js`, `(owner)/layout.js`, `(admin)/layout.js` | Nested layouts; pass static nav data to `AppShell` |
| every `app/**/page.js` | Await `params`, export `metadata`/`generateMetadata`, render one client view |
| `app/(public)/page.js` | Landing page (static HTML + plain GET search form) |
| `app/(public)/cars/[id]/page.js` | `generateStaticParams`, `generateMetadata`, JSON-LD from the **seed** |
| `app/sitemap.js`, `app/robots.js`, `app/not-found.js` | Metadata routes |
| `StatusBadge.js`, `States.js`, `DataTable.js`, `BookingsTable.js`, `CarCard.js`, `Brand.js` | Pure presentational components (no hooks); they run on the server when used by a server tree and in the browser when imported by a client view |

## Client Components (`"use client"`)

| Group | Files | Why client |
|---|---|---|
| Providers | `Providers.js`, `Toast.js` | SWR config, storage event listener, toasts |
| Chrome | `SiteHeader.js`, `SiteFooter.js`, `NotificationBell.js`, `AnnouncementBar.js`, `StorageHealth.js`, `AppShell.js`, `RoleGuard.js` | Read the session / data, handle menus and redirects |
| Interactive widgets | `Modal.js`, `Form.js`, `Pagination.js`, `AvailabilityCalendar.js`, `CarGallery.js`, `SmartImage.js`, `Charts.js`, `CarMap.js`, `CarMapInner.js`, `CarForm.js`, `BookingPanel.js`, `DisputeThread.js` | State, events, browser-only libraries (Leaflet, Recharts) |
| Page views | `CatalogueClient.js`, `CarDetailClient.js`, `FeaturedCars.js`, all of `components/views/*` | Read data through SWR hooks and call domain actions |
| Data hooks | `lib/hooks.js` | SWR + storage |

## Plain modules (no React)

`lib/*.js` (except `hooks.js`) are framework-free: storage helpers, seed, session, domain rules, CSV, formatting. They run in the browser, and also in Node for `npm test` (with a fake `window`). `lib/seed.js` is also imported by server code (sitemap, `generateMetadata`) because it needs no browser APIs.

## Props crossing the boundary

Server files only pass **serialisable values** (strings, plain objects) to client components, e.g. `<OwnerAvailabilityView id={id} />` and the `nav` array given to `AppShell`. No functions are passed from server to client.

## Browser-only libraries

- **Leaflet** touches `window` on import, so it is loaded through `next/dynamic(..., { ssr: false })` inside a Client Component.
- **Recharts** is rendered only after mount (`useMounted`).
