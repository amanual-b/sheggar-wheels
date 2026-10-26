"use client";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useSession } from "@/lib/hooks";
import { setUserStatus } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { hasRole } from "@/lib/session";

export function UserStatusButton({ u, adminId }) {
  const run = useAction();
  if (hasRole(u, "admin") || u.id === adminId) return <span className="muted small">Protected</span>;
  return u.status === "suspended" ? (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => run(setUserStatus(u.id, "active"), `${u.name} was reinstated.`)}>Reinstate<span className="sr-only"> {u.name}</span></button>
  ) : (
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(setUserStatus(u.id, "suspended"), `${u.name} was suspended. Their cars are hidden.`)}>Suspend<span className="sr-only"> {u.name}</span></button>
  );
}

export default function AdminUsersView() {
  const { users, loading } = useData();
  const { user } = useSession();
  if (loading || !user) return <PageLoading label="Loading users…" />;
  return (
    <div className="stack-lg">
      <PageHeader title="Users" subtitle="Suspended users see an access-blocked message and their listings are hidden." />
      <DataTable
        caption="Users"
        rows={users}
        getKey={(u) => u.id}
        columns={[
          { header: "Name", cell: (u) => <Link href={`/admin/users/${u.id}`}><b>{u.name}</b></Link> },
          { header: "Email", cell: (u) => u.email },
          { header: "Roles", cell: (u) => u.roles.join(" + ") },
          { header: "Joined", cell: (u) => formatDate(String(u.createdAt).slice(0, 10)) },
          { header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
          { header: "Action", cell: (u) => <UserStatusButton u={u} adminId={user.id} /> },
        ]}
      />
    </div>
  );
}
