# STRATEGY – rendering and data strategy per route

Sheggar Wheels has **no database**. All durable data lives in the visitor's `localStorage` and the session in `sessionStorage`. Servers cannot read either, so the server can only render the *shell* of a page; the data-dependent content is rendered in the browser. This is why almost every page is a thin Server Component wrapper around a Client Component view (see BOUNDARY.md).

How each route is built by Next.js 15 follows from the code below (default behaviour; confirm with the route table printed by `next build`). No route uses `revalidate` or Server Actions: there is no server data to revalidate.

| Route | Strategy | Why |
|---|---|---|
| `/` | **Static** server page + client `FeaturedCars` | Hero, search form (plain GET form to `/cars`) and "how it works" need no data; featured cars read storage on the client. |
| `/cars` | **Dynamic** (reads `searchParams`): server renders the filtered list from the seed, then the client swaps in browser data | A static page using `useSearchParams` is client-rendered only (empty HTML, late paint). Reading `searchParams` on the server puts real cars in the first HTML. Filters/sort/page live in the URL and are changed with the History API (`replaceState`), which Next.js syncs with `useSearchParams`, so filtering never calls the server. |
| `/cars/[id]` | **SSG** for the 9 seeded ids via `generateStaticParams`; any other id renders **on demand** | The HTML already contains the car (gallery, specs, description) from the seed; `generateMetadata`, the per-car Open Graph image and JSON-LD use the seed too. Date-dependent parts (calendar, booking panel, `?start=&end=`) mount after hydration so static HTML never depends on "today". Cars created in the browser still work (the view waits for browser data instead of showing a false 404). |
| `/signin`, `/signup` | **Static shell**, client form | Reads `?next=` (Suspense) and writes the session to `sessionStorage`. `noindex`. |
| `/guardrails` | **Static**, client | Runs the negative tests in the browser. `noindex`. |
| `/dashboard`, `/bookings`, `/checkout` | **Static shell**, client | Session + data are in the browser; `RoleGuard` redirects to `/signin?next=…`. Private: `noindex`, disallowed in `robots.txt`. |
| `/bookings/[id]`, `/bookings/[id]/track`, `/bookings/[id]/review` | **Dynamic** (on-demand), client view | Ids are created at runtime, so they cannot be pre-rendered. The view re-checks ownership (`getBookingForRenter`). |
| `/owner`, `/owner/cars`, `/owner/cars/new`, `/owner/earnings`, `/owner/reviews`, `/owner/disputes` | **Static shell**, client | Owner data comes from storage. |
| `/owner/cars/[id]/edit`, `…/availability`, `…/bookings` | **Dynamic**, client view | Runtime ids; every view calls `getOwnerCar` which enforces ownership. |
| `/owner/bookings/[id]/track` | **Dynamic**, client view | Owner's simulated trip tracker for an in-progress rental of their own car; uses `getBookingForOwner` (ownership enforced). |
| `/admin`, `/admin/listings`, `/admin/users`, `/admin/bookings`, `/admin/disputes`, `/admin/reports`, `/admin/announcements` | **Static shell**, client | Admin data from storage. |
| `/admin/users/[id]`, `/admin/disputes/[id]` | **Dynamic**, client view | Runtime ids. |
| `/sitemap.xml`, `/robots.txt` | **Static** metadata routes | Sitemap lists public routes + the seeded approved cars. Robots excludes private paths (crawler guidance only, not access control). |

## Data loading pattern

`lib/hooks.js` wraps the storage readers in **SWR**. SWR is normally for remote data; here the "fetcher" reads browser storage, which gives the same benefits without a server: cached reads, revalidation on focus and mount, and manual `refreshData()` after every write (the data layer is synchronous, so a write is followed by one revalidation). The browser `storage` event triggers `refreshData()` so other tabs update – this is **not** real-time server sync.

**Private pages** (dashboards, bookings, owner/admin) have no data during server rendering and the first client render, so they show a loading state; this keeps server and client HTML identical (no hydration mismatch).

**Public pages** (home, catalogue, car detail, announcement bar) call `useData({ seeded: true })`: SWR starts from the **seed data** as `fallbackData`, so the server renders real content immediately, then SWR revalidates and swaps in the visitor's real browser data. Trade-off: a returning visitor who changed data may briefly see the seed version. The date-availability filter is skipped while the seed is shown so server and client markup match.

## Other decisions

- **Metadata / Open Graph** – `metadata` on public pages, `generateMetadata` for cars (seed only), `metadataBase` from `NEXT_PUBLIC_SITE_URL`, canonical links only when that URL is set. Share images are 1200×630 files in `public/og/`: `cars.jpg` (first car of the default catalogue order) for `/cars`, `<carId>.jpg` for each car page, `default.jpg` elsewhere.
- **Images** – `next/image` with `sizes`, `priority` for above-the-fold photos, and a fallback image on error.
- **Map** – Leaflet loaded only in the browser through `next/dynamic` (`ssr: false`).
- **Route handlers / Server Actions** – intentionally not used (no backend). The equivalent logic lives in `lib/*.js` and is the future API surface (FUTURE.md).
