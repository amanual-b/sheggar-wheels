"use client";
import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import SmartImage from "@/components/SmartImage";
import StatusBadge from "@/components/StatusBadge";
import { SelectField, TextField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData } from "@/lib/hooks";
import { moderateCar } from "@/lib/admin";
import { formatETB } from "@/lib/format";

export default function AdminListingsView() {
  const { cars, userById, loading } = useData();
  const run = useAction();
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  if (loading) return <PageLoading label="Loading listings…" />;

  const pending = cars.filter((c) => c.status === "pending");
  const all = cars.filter((c) => !filter || c.status === filter);
  const carCell = (c) => (
    <div className="cell-car">
      <div className="mini"><SmartImage src={c.photos[0]} alt="" sizes="56px" /></div>
      <div><Link href={`/cars/${c.id}`}><b>{c.make} {c.model} {c.year}</b></Link><div className="muted small">{c.neighbourhood}</div></div>
    </div>
  );
  const close = () => { setRejecting(null); setReason(""); setError(""); };
  const reject = (e) => {
    e.preventDefault();
    const res = moderateCar(rejecting.id, "reject", reason);
    if (!res.ok) return setError(res.error);
    run(res, "Listing rejected. The owner can see your reason.");
    close();
  };

  return (
    <div className="stack-lg">
      <PageHeader title="Listings" subtitle="Approve or reject new and edited listings before they appear publicly." />
      <section aria-labelledby="pq">
        <h2 id="pq">Pending review ({pending.length})</h2>
        <DataTable
          caption="Listings pending review"
          rows={pending}
          getKey={(c) => c.id}
          empty={<EmptyState title="Nothing to review">All listings have been moderated.</EmptyState>}
          columns={[
            { header: "Car", cell: carCell },
            { header: "Owner", cell: (c) => userById.get(c.ownerId)?.name || "Unknown" },
            { header: "Price/day", numeric: true, cell: (c) => formatETB(c.pricePerDay) },
            {
              header: "Decision",
              cell: (c) => (
                <div className="btn-row">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => run(moderateCar(c.id, "approve"), "Listing approved and now public.")}>Approve<span className="sr-only"> {c.make} {c.model}</span></button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRejecting(c)}>Reject<span className="sr-only"> {c.make} {c.model}</span></button>
                </div>
              ),
            },
          ]}
        />
      </section>
      <section aria-labelledby="al">
        <div className="row-between">
          <h2 id="al">All listings</h2>
          <div style={{ minWidth: 180 }}>
            <SelectField label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              {["approved", "pending", "rejected", "inactive", "draft"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </SelectField>
          </div>
        </div>
        <DataTable
          caption="All listings"
          rows={all}
          getKey={(c) => c.id}
          empty={<EmptyState title="No listings with that status" />}
          columns={[
            { header: "Car", cell: carCell },
            { header: "Owner", cell: (c) => userById.get(c.ownerId)?.name || "Unknown" },
            { header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
            { header: "Price/day", numeric: true, cell: (c) => formatETB(c.pricePerDay) },
          ]}
        />
      </section>
      <Modal open={!!rejecting} onClose={close} title="Reject listing">
        <form className="stack" onSubmit={reject} noValidate>
          <p style={{ margin: 0 }}>Tell the owner what to fix for <b>{rejecting ? `${rejecting.make} ${rejecting.model}` : ""}</b>.</p>
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} error={error} maxLength={300} />
          <div className="modal-foot" style={{ padding: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn btn-danger">Reject listing</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
