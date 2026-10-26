# PERF – performance

## Status: measurements still to be recorded

This project was built in an environment with **no internet access, no Lighthouse and no deployment**, so **no Lighthouse, LCP, CLS or INP numbers exist yet**, and none are claimed here. Complete the tables below from the deployed build.

## How to measure (repeatable)

1. `npm run build && npm start` (or use the deployed URL – preferred).
2. Chrome → open an **Incognito** window (no extensions) → DevTools → **Lighthouse**.
3. Mode *Navigation*, device *Mobile*, categories Performance + Accessibility + Best Practices + SEO. Run 3 times per page and record the median.
4. Pages: `/`, `/cars`, `/cars/car_tucson`, `/dashboard` (signed in as Meron).
5. For INP use DevTools → Performance → interact (filter, paginate) or the web-vitals Chrome extension.
6. Label every figure **deployed** or **local**.

## Results (fill in)

| Page | Source | Perf | A11y | Best Pr. | SEO | LCP | CLS | INP | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/` | | | | | | | | | |
| `/cars` | | | | | | | | | |
| `/cars/car_tucson` | | | | | | | | | |
| `/dashboard` | | | | | | | | | |

## Before / after log (fill in as you change things)

| Change | Page | Metric before → after | Why it helped |
|---|---|---|---|
| | | | |

## Performance pass #2 (after the first deployed build felt slow)

Not yet measured: re-run the table above on the new build and fill the before/after log. These are the causes I found by reading the code, and what changed:

| Suspected cause | Change |
|---|---|
| **Late LCP**: catalogue, featured cars and car detail rendered an empty loading state on the server and only showed cars after hydration and a storage read | Public pages now start from the seed (`useData({ seeded: true })`), so the **first HTML contains real cars and images**; `/cars` reads `searchParams` on the server so filtered lists render server-side too |
| **Layout shift (CLS)**: a demo banner and the announcement bar sat *above* the header and appeared after hydration, pushing the page down | Both removed from above the header. "Demo data" is now a small badge inside the header; announcements render *below* the header from seeded data (no late insertion) |
| **Client-only car page**: `useSearchParams` inside a statically generated page forces client rendering of that subtree | Car detail reads `?start=&end=` in an effect, so the page stays statically generated with content in the HTML |
| **Third-party work on load**: Leaflet and map tiles loaded immediately on car pages | The map loads only when within ~300px of the viewport (`IntersectionObserver`) |
| **Main-thread work**: every storage read rebuilt the whole seed object; the provider triggered an extra refresh of every SWR key on mount | `initializeDemoData()` builds the seed only when a key is missing and skips work after the first check; duplicate refresh removed |
| **Paint cost**: sticky header used `backdrop-filter` blur | Solid background |
| **Competing image priorities**: both hero images were `priority` | Only the main hero image is preloaded; catalogue priority stays on the first three cards |
| Below-the-fold rendering | "How it works" uses `content-visibility: auto` |

### Pass #3 (audit)

| Finding | Change |
|---|---|
| Every filter/sort/page change on the (now dynamic) `/cars` would have re-requested the server | Catalogue updates the URL with `history.replaceState`; no network round trip, instant INP |
| Recharts (large) shipped in the main chunk of the owner/admin dashboards | Charts load on demand (`components/LazyCharts.js`) with a skeleton of the same height (no layout shift) |
| Footer was a client component pulling in modal + toast code on every page | Footer is now a plain server component |
| Storage health scan parsed every saved collection during startup | Runs in `requestIdleCallback` |
| Announcement bar (client, above content) removed entirely | Announcements are shown in the notification panel |
| Hero image was preloaded even where it is hidden (phones) | No `priority` on hero images |
| Optimised images cached only 60s by default | `images.minimumCacheTTL` = 1 year; `/cars`, `/og`, `/brand` served with a 1-week `Cache-Control` |
| Car photos 1.4MB total | Re-encoded progressive JPEG, ~0.9MB total |

If the score is still low: serve photos at exact display sizes (they are ~740px wide, ~80KB each), test with a real-phone Lighthouse profile, and check the unused-JavaScript report (Recharts and Leaflet only load on pages that use them).

## Performance measures already in the code (not measured)

- **`next/image`** for car photos with explicit `sizes`; `priority` only on the first three catalogue cards, the gallery's main photo and the two hero images. Photos are served as AVIF/WebP (`next.config.mjs`).
- **Photos were pre-processed**: baked-in caption strips removed and images upscaled 3× with Lanczos so they stay sharp; they are still small source files, which keeps LCP image weight low.
- **`next/font`** self-hosts Plus Jakarta Sans with `display: swap` (no render-blocking font request).
- **Leaflet is code-split**: loaded with `next/dynamic` (`ssr:false`) only on pages that show a map. Recharts is only imported by the dashboard chart component.
- **Layout-shift guards**: images use `fill` inside aspect-ratio boxes (`.car-media`, `.gallery-main`), skeleton blocks reserve space on the landing page, charts have a fixed height.
- **No client data fetching**: reads are synchronous storage reads cached by SWR; there are no network calls for data.
- **Plain CSS** (one file) – no CSS-in-JS runtime.
- **Known cost**: because data comes from the browser, data-driven content appears only after hydration (loading states first). That is inherent to the no-database design; the landing page shell, hero and metadata are server-rendered.
