"use client";
import Link from "next/link";
import BookingsTable from "@/components/BookingsTable";
import StatusBadge from "@/components/StatusBadge";
import { UserStatusButton } from "@/components/views/AdminUsersView";
import { EmptyState, ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAdminBookings, useData, useSession } from "@/lib/hooks";
import { formatDate, formatETB } from "@/lib/format";

export default function AdminUserDetailView({ id }) {
  const { userById, cars, carById, loading } = useData();
  const { items: bookings, loading: bl } = useAdminBookings();
  const { user: admin } = useSession();
  if (loading || bl || !admin) return <PageLoading label="Loading user…" />;
  const u = userById.get(id);
  if (!u) return <ErrorState title="User not found" actionHref="/admin/users" actionLabel="Back to users" />;

  const theirCars = cars.filter((c) => c.ownerId === u.id);
  const theirBookings = bookings.filter((b) => b.renterId === u.id || b.ownerId === u.id);
  return (
    <div className="stack-lg">
      <PageHeader title={u.name} subtitle={u.email} actions={<><UserStatusButton u={u} adminId={admin.id} /><Link className="btn btn-secondary" href="/admin/users">All users</Link></>} />
      <section className="card card-body" aria-labelledby="acct">
        <h2 id="acct" style={{ fontSize: "1.1rem" }}>Account</h2>
        <dl className="kv">
          <dt>Status</dt><dd><StatusBadge status={u.status} /></dd>
          <dt>Roles</dt><dd>{u.roles.join(" + ")}</dd>
          <dt>Phone</dt><dd>{u.phone || "-"}</dd>
          <dt>Joined</dt><dd>{formatDate(String(u.createdAt).slice(0, 10))}</dd>
          <dt>User id</dt><dd><code>{u.id}</code></dd>
        </dl>
        {u.status === "suspended" ? <div className="alert alert-warning" style={{ marginTop: 12 }}>This user sees an access-blocked screen and cannot perform any actions. Their listings are hidden from the public.</div> : null}
      </section>
      <section aria-labelledby="uc">
        <h2 id="uc">Cars ({theirCars.length})</h2>
        {theirCars.length ? (
          <ul>{theirCars.map((c) => <li key={c.id}><Link href={`/cars/${c.id}`}>{c.make} {c.model}</Link> · {formatETB(c.pricePerDay)}/day · <StatusBadge status={c.status} /></li>)}</ul>
        ) : <p className="muted">This user has not listed any cars.</p>}
      </section>
      <section aria-labelledby="ub">
        <h2 id="ub">Bookings ({theirBookings.length})</h2>
        <BookingsTable caption={`Bookings involving ${u.name}`} bookings={theirBookings} carById={carById} userById={userById} parties empty={<EmptyState title="No bookings for this user" />} />
      </section>
    </div>
  );
}
