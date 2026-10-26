"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import NotificationBell from "@/components/NotificationBell";
import StorageHealth from "@/components/StorageHealth";
import { refreshData, useSession } from "@/lib/hooks";
import { hasRole, signOut } from "@/lib/session";
import { initials } from "@/lib/format";

export default function SiteHeader() {
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const links = [{ href: "/cars", label: "Browse cars" }];
  if (user && user.status !== "suspended") {
    if (hasRole(user, "renter")) links.push({ href: "/dashboard", label: "My trips" }, { href: "/bookings", label: "Bookings" });
    if (hasRole(user, "owner")) links.push({ href: "/owner", label: "Owner" });
    if (hasRole(user, "admin")) links.push({ href: "/admin", label: "Admin" });
  }
  const current = (href) => (pathname === href || (href !== "/" && pathname.startsWith(href + "/")) ? "page" : undefined);

  const handleSignOut = () => {
    signOut();
    refreshData();
    router.push("/");
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button type="button" className="btn btn-secondary btn-sm menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav className="nav" id="site-nav" data-open={open} aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link" aria-current={current(l.href)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <NotificationBell />
                <span className="user-chip">
                  <span>{user.name.split(" ")[0]}</span>
                  <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Create account</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <StorageHealth />
    </>
  );
}
