"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CarCard from "@/components/CarCard";
import Pagination from "@/components/Pagination";
import { EmptyState, PageLoading } from "@/components/States";
import { SelectField, TextField } from "@/components/Form";
import { useData } from "@/lib/hooks";
import { averageRating } from "@/lib/reviews";
import { SORT_OPTIONS, filterCars, filtersToQuery, hasActiveFilters, paginate, parseFilters, sortCars } from "@/lib/catalogue";
import { NEIGHBOURHOODS, SEAT_OPTIONS } from "@/lib/constants";
import { isCarPubliclyBookable } from "@/lib/bookings";
import { pluralize } from "@/lib/format";

export default function CatalogueClient() {
  const params = useSearchParams();
  const { cars, users, bookings, reviews, loading, fromSeed } = useData({ seeded: true });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const f = useMemo(() => parseFilters(params), [params]);

  const publicCars = useMemo(() => cars.filter((c) => isCarPubliclyBookable(c, users)), [cars, users]);
  const filtered = useMemo(() => sortCars(filterCars(publicCars, fromSeed ? { ...f, from: "", to: "" } : f, bookings), f.sort, bookings), [publicCars, f, bookings, fromSeed]);
  const pageData = paginate(filtered, f.page);
  const ratings = useMemo(() => {
    const map = new Map();
    for (const c of publicCars) {
      const list = reviews.filter((r) => r.carId === c.id);
      const avg = averageRating(list);
      if (avg) map.set(c.id, { avg, count: list.length });
    }
    return map;
  }, [publicCars, reviews]);

  // History API: Next.js syncs useSearchParams with it, so changing filters never hits the server.
  const setUrl = (query) => window.history.replaceState(null, "", query ? `/cars?${query}` : "/cars");

  // Keep the URL honest if the page had to be clamped (e.g. after a filter change).
  useEffect(() => {
    if (!loading && f.page !== pageData.page) setUrl(filtersToQuery({ ...f, page: pageData.page }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, f, pageData.page]);

  const go = (next) => setUrl(filtersToQuery({ ...next, page: 1 }));
  const goPage = (n) => {
    setUrl(filtersToQuery({ ...f, page: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const next = parseFilters(new URLSearchParams([...d.entries()].map(([k, v]) => [k, String(v)])));
    go({ ...next, sort: f.sort });
    setFiltersOpen(false);
  };

  const neighbourhoods = NEIGHBOURHOODS.map((n) => n.name);
  const queryKey = filtersToQuery({ ...f, page: 1, sort: "newest" });

  return (
    <div className="container section" style={{ paddingTop: "2rem" }}>
      <div className="page-head">
        <div>
          <h1>Find a car in Addis Ababa</h1>
          <p>{loading ? "Loading cars…" : `${pluralize(filtered.length, "car")} available${hasActiveFilters(f) ? " with your filters" : ""}`}</p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-secondary filter-toggle" aria-expanded={filtersOpen} aria-controls="filters" onClick={() => setFiltersOpen((o) => !o)}>
            {filtersOpen ? "Hide filters" : "Show filters"}
          </button>
          <div style={{ minWidth: 200 }}>
            <SelectField label="Sort by" value={f.sort} onChange={(e) => go({ ...f, sort: e.target.value })}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </SelectField>
          </div>
        </div>
      </div>

      <div className="catalogue">
        <form key={queryKey} id="filters" className="card filters" data-open={filtersOpen} onSubmit={onSubmit} aria-label="Filter cars">
          <TextField label="Search make or model" name="q" defaultValue={f.q} placeholder="e.g. Corolla" maxLength={60} />
          <SelectField label="Neighbourhood" name="neighbourhood" defaultValue={f.neighbourhood}>
            <option value="">Anywhere in Addis Ababa</option>
            {neighbourhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
          <div className="form-grid">
            <TextField label="Min price (ETB)" name="minPrice" type="number" min="0" step="100" inputMode="numeric" defaultValue={f.minPrice ?? ""} />
            <TextField label="Max price (ETB)" name="maxPrice" type="number" min="0" step="100" inputMode="numeric" defaultValue={f.maxPrice ?? ""} />
          </div>
          <SelectField label="Transmission" name="transmission" defaultValue={f.transmission}>
            <option value="">Any</option>
            <option>Automatic</option>
            <option>Manual</option>
          </SelectField>
          <SelectField label="Minimum seats" name="seats" defaultValue={f.seats ?? ""}>
            <option value="">Any</option>
            {SEAT_OPTIONS.map((s) => <option key={s} value={s}>{s}+ seats</option>)}
          </SelectField>
          <div className="form-grid">
            <TextField label="From" name="from" type="date" defaultValue={f.from} />
            <TextField label="To" name="to" type="date" defaultValue={f.to} min={f.from || undefined} />
          </div>
          <button type="submit" className="btn btn-primary">Apply filters</button>
          <Link className="btn btn-ghost" href="/cars" onClick={(e) => { e.preventDefault(); setUrl(""); setFiltersOpen(false); }}>Clear all</Link>
        </form>

        <section aria-label="Search results" aria-live="polite">
          {loading ? (
            <PageLoading label="Loading cars…" />
          ) : pageData.total === 0 ? (
            <EmptyState title="No cars match your filters" actionHref="/cars" actionLabel="Clear filters">
              Try a wider price range, another neighbourhood or different dates.
            </EmptyState>
          ) : (
            <>
              <div className="cars-grid">
                {pageData.items.map((c, i) => <CarCard key={c.id} car={c} rating={ratings.get(c.id)} priority={i < 3} />)}
              </div>
              <Pagination page={pageData.page} totalPages={pageData.totalPages} hrefFor={(n) => `/cars?${filtersToQuery({ ...f, page: n })}`} onChange={goPage} label="Catalogue pages" />
              <p className="center muted small" style={{ marginTop: 8 }}>
                Showing {(pageData.page - 1) * pageData.pageSize + 1}-{Math.min(pageData.page * pageData.pageSize, pageData.total)} of {pageData.total}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
