import Link from "next/link";
import DataTable from "@/components/DataTable";
import SmartImage from "@/components/SmartImage";
import StatusBadge from "@/components/StatusBadge";
import { formatDateRange, formatETB } from "@/lib/format";

/** Shared accessible bookings table. `extra` adds a trailing actions column. */
export default function BookingsTable({ caption, bookings, carById, userById, hrefFor, parties = false, extra, empty }) {
  const columns = [
    {
      header: "Car",
      cell: (b) => {
        const car = carById.get(b.carId);
        return (
          <div className="cell-car">
            <div className="mini">{car ? <SmartImage src={car.photos[0]} alt="" sizes="56px" /> : null}</div>
            <div>
              <b>{car ? `${car.make} ${car.model}` : "Unknown car"}</b>
              <div className="muted small">{b.id}</div>
            </div>
          </div>
        );
      },
    },
    ...(parties
      ? [
          { header: "Renter", cell: (b) => userById?.get(b.renterId)?.name || "Unknown" },
          { header: "Owner", cell: (b) => userById?.get(b.ownerId)?.name || "Unknown" },
        ]
      : []),
    { header: "Dates", cell: (b) => <span className="nowrap">{formatDateRange(b.startDate, b.endDate)}</span> },
    { header: "Days", numeric: true, cell: (b) => b.days },
    { header: "Total", numeric: true, cell: (b) => formatETB(b.total) },
    { header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
    ...(hrefFor ? [{ header: "Details", cell: (b) => <Link className="btn btn-secondary btn-sm" href={hrefFor(b)}>View<span className="sr-only"> booking {b.id}</span></Link> }] : []),
    ...(extra ? [{ header: "Actions", cell: extra }] : []),
  ];
  return <DataTable caption={caption} columns={columns} rows={bookings} getKey={(b) => b.id} empty={empty} />;
}
