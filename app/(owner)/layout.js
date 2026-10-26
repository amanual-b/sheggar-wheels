import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AppShell from "@/components/AppShell";

export const metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/owner", label: "Overview", icon: "📊", exact: true },
  { href: "/owner/cars", label: "My cars", icon: "🚗" },
  { href: "/owner/earnings", label: "Earnings", icon: "💰", exact: true },
  { href: "/owner/reviews", label: "Reviews", icon: "⭐", exact: true },
  { href: "/owner/disputes", label: "Disputes", icon: "⚖️", exact: true },
];

export default function OwnerLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <AppShell role="owner" title="Owner tools" nav={NAV}>{children}</AppShell>
      </main>
      <SiteFooter />
    </>
  );
}
