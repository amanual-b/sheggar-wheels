"use client";
import { useMemo } from "react";
import CarCard from "@/components/CarCard";
import { EmptyState } from "@/components/States";
import { useData } from "@/lib/hooks";
import { isCarPubliclyBookable } from "@/lib/bookings";
import { popularityOf } from "@/lib/catalogue";
import { averageRating } from "@/lib/reviews";

export default function FeaturedCars() {
  const { cars, users, bookings, reviews, loading } = useData({ seeded: true });
  const featured = useMemo(
    () =>
      cars
        .filter((c) => isCarPubliclyBookable(c, users))
        .sort((a, b) => popularityOf(b.id, bookings) - popularityOf(a.id, bookings))
        .slice(0, 3),
    [cars, users, bookings]
  );
  if (loading) {
    return (
      <div className="grid grid-3" aria-hidden="true">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}
      </div>
    );
  }
  if (!featured.length) return <EmptyState title="No cars listed yet" actionHref="/cars" actionLabel="Browse cars">Check back soon.</EmptyState>;
  return (
    <div className="grid grid-3">
      {featured.map((c) => {
        const list = reviews.filter((r) => r.carId === c.id);
        const avg = averageRating(list);
        return <CarCard key={c.id} car={c} rating={avg ? { avg, count: list.length } : null} />;
      })}
    </div>
  );
}
