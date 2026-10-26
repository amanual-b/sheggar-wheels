"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

function isActive(pathname, href, exact) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Sidebar layout shared by renter / owner / admin areas. */
export default function AppShell({ role, title, nav, children }) {
  const pathname = usePathname();
  return (
    <RoleGuard role={role}>
      <div className="container app-shell">
        <nav className="sidebar" aria-label={`${title} navigation`}>
          <h2>{title}</h2>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="side-link" aria-current={isActive(pathname, item.href, item.exact) ? "page" : undefined}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div id="app-main" style={{ minWidth: 0 }}>{children}</div>
      </div>
    </RoleGuard>
  );
}
