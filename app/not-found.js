import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container section center" style={{ maxWidth: 640 }}>
        <h1>Page not found</h1>
        <p className="muted">That page does not exist.</p>
        <Link className="btn btn-primary" href="/cars">Browse cars</Link>
      </main>
    </>
  );
}
