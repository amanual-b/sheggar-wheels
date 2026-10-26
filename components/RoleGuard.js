"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, refreshData } from "@/lib/hooks";
import { getCurrentSession, hasRole, signOut } from "@/lib/session";
import { enableOwnerRole } from "@/lib/users";
import { PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";

function AccessBlocked({ user }) {
  const router = useRouter();
  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <div className="alert alert-error" role="alert">
        <b>Access blocked</b>
        {user.name}, this account is suspended. Actions are disabled until an administrator reinstates it.
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={() => { signOut(); refreshData(); router.push("/"); }}>
          Sign out
        </button>
        <Link className="btn btn-secondary" href="/cars">Browse cars</Link>
      </div>
    </div>
  );
}

function AccessDenied({ role, user }) {
  const run = useAction();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const canEnableOwner = role === "owner" && hasRole(user, "renter");
  return (
    <div className="container section" style={{ maxWidth: 680 }}>
      <div className="alert alert-warning" role="alert">
        <b>You do not have access to this area</b>
        {role === "admin"
          ? "Admin tools are only available to administrator accounts."
          : role === "owner"
            ? "Owner tools need the owner capability on your account."
            : "This area is for renter accounts."}
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        {canEnableOwner ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              const ok = run(enableOwnerRole(), "Owner tools enabled on your account.");
              setBusy(false);
              if (ok) router.refresh();
            }}
          >
            Enable owner tools on my account
          </button>
        ) : null}
        <button type="button" className="btn btn-secondary" onClick={() => { signOut(); refreshData(); router.push(`/signin?next=${encodeURIComponent(window.location.pathname)}`); }}>
          Switch account
        </button>
        <Link className="btn btn-ghost" href="/">Back to home</Link>
      </div>
    </div>
  );
}

/** Hides protected UI. Every action ALSO re-checks the same rules in lib/*. */
export default function RoleGuard({ role, children }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // The SWR cache can be one tick behind right after sign-in; confirm against storage first.
      if (getCurrentSession()) {
        refreshData();
        return;
      }
      const next = pathname + window.location.search;
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) return <PageLoading label="Checking your session…" />;
  if (!user) return <PageLoading label="Redirecting to sign in…" />;
  if (user.status === "suspended") return <AccessBlocked user={user} />;
  if (!hasRole(user, role)) return <AccessDenied role={role} user={user} />;
  return children;
}
