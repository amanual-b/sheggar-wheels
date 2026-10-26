import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AppShell from "@/components/AppShell";

export const metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Overview", icon: "📈", exact: true },
  { href: "/admin/listings", label: "Listings", icon: "🚗" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/bookings", label: "Bookings", icon: "🧾" },
  { href: "/admin/disputes", label: "Disputes", icon: "⚖️" },
  { href: "/admin/reports", label: "Reports", icon: "📄", exact: true },
  { href: "/admin/announcements", label: "Announcements", icon: "📣", exact: true },
];

export default function AdminLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <AppShell role="admin" title="Admin" nav={NAV}>{children}</AppShell>
      </main>
      <SiteFooter />
    </>
  );
}
