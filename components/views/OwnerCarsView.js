"use client";
import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import SmartImage from "@/components/SmartImage";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useOwnerCars } from "@/lib/hooks";
import { setCarActive } from "@/lib/cars";
import { formatETB } from "@/lib/format";

export default function OwnerCarsView() {
  const { items: cars, loading } = useOwnerCars();
  const run = useAction();
  const [target, setTarget] = useState(null);
  if (loading) return <PageLoading label="Loading your cars…" />;

  return (
    <div className="stack-lg">
      <PageHeader title="My cars" subtitle="Listings need admin approval before the public can see them." actions={<Link className="btn btn-primary" href="/owner/cars/new">Add a car</Link>} />
      <DataTable
        caption="Your car listings"
        rows={cars}
        getKey={(c) => c.id}
        empty={<EmptyState title="You have not listed a car yet" actionHref="/owner/cars/new" actionLabel="Add a car">Publish your first listing and send it for review.</EmptyState>}
        columns={[
          { header: "Car", cell: (c) => (<div className="cell-car"><div className="mini"><SmartImage src={c.photos[0]} alt="" sizes="56px" /></div><div><b>{c.make} {c.model}</b><div className="muted small">{c.year} · {c.neighbourhood}</div></div></div>) },
          { header: "Price/day", numeric: true, cell: (c) => formatETB(c.pricePerDay) },
          { header: "Status", cell: (c) => (<div><StatusBadge status={c.status} />{c.status === "rejected" && c.rejectionReason ? <div className="small muted" style={{ maxWidth: 240 }}>{c.rejectionReason}</div> : null}</div>) },
          {
            header: "Manage",
            cell: (c) => (
              <div className="btn-row">
                <Link className="btn btn-secondary btn-sm" href={`/owner/cars/${c.id}/edit`}>Edit<span className="sr-only"> {c.make} {c.model}</span></Link>
                <Link className="btn btn-secondary btn-sm" href={`/owner/cars/${c.id}/availability`}>Availability<span className="sr-only"> {c.make} {c.model}</span></Link>
                <Link className="btn btn-secondary btn-sm" href={`/owner/cars/${c.id}/bookings`}>Bookings<span className="sr-only"> {c.make} {c.model}</span></Link>
                {c.status === "inactive" ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => run(setCarActive(c.id, true), "Listing reactivated.")}>Reactivate<span className="sr-only"> {c.make} {c.model}</span></button>
                ) : ["approved", "pending", "draft"].includes(c.status) ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(c)}>Deactivate<span className="sr-only"> {c.make} {c.model}</span></button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title="Deactivate this listing?"
        footer={<><button type="button" className="btn btn-secondary" onClick={() => setTarget(null)}>Keep listed</button><button type="button" className="btn btn-danger" onClick={() => { run(setCarActive(target.id, false), "Listing deactivated."); setTarget(null); }}>Deactivate</button></>}
      >
        <p>{target ? `${target.make} ${target.model}` : ""} will disappear from the public catalogue. You can reactivate it any time.</p>
      </Modal>
    </div>
  );
}
