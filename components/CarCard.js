import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { formatETB, pluralize } from "@/lib/format";

export default function CarCard({ car, rating, priority = false }) {
  return (
    <article className="card car-card">
      <div className="car-media">
        <span className="badge badge-purple">{car.fuel || "Petrol"}</span>
        <SmartImage src={car.photos[0]} alt={`${car.make} ${car.model} ${car.year}`} priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 360px" />
      </div>
      <div className="car-body">
        <h3 className="car-title">
          <Link href={`/cars/${car.id}`}>
            {car.make} {car.model} <span className="muted" style={{ fontWeight: 500 }}>{car.year}</span>
          </Link>
        </h3>
        <div className="car-meta">
          <span>📍 {car.neighbourhood}</span>
          <span>{pluralize(car.seats, "seat")}</span>
          <span>{car.transmission}</span>
        </div>
        <div className="row-between" style={{ marginTop: "auto" }}>
          <span className="price">
            {formatETB(car.pricePerDay)} <small>/ day</small>
          </span>
          {rating ? (
            <span className="rating" aria-label={`Rated ${rating.avg} out of 5 from ${pluralize(rating.count, "review")}`}>
              ★ {rating.avg} <span className="muted">({rating.count})</span>
            </span>
          ) : (
            <span className="muted small">No reviews yet</span>
          )}
        </div>
      </div>
    </article>
  );
}
