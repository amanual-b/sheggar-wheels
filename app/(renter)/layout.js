import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AppShell from "@/components/AppShell";

export const metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "🏠", exact: true },
  { href: "/bookings", label: "Bookings", icon: "🧾", exact: true },
  { href: "/cars", label: "Find a car", icon: "🔎", exact: true },
];

export default function RenterLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <AppShell role="renter" title="Renter" nav={NAV}>{children}</AppShell>
      </main>
      <SiteFooter />
    </>
  );
}
