import { Suspense } from "react";
import CatalogueClient from "@/components/CatalogueClient";
import { PageLoading } from "@/components/States";
import { canonicalFor } from "@/lib/site";

export const metadata = {
  title: "Browse cars",
  description: "Search and filter peer-to-peer rental cars in Addis Ababa by neighbourhood, price, transmission, seats and dates.",
  alternates: canonicalFor("/cars"),
  openGraph: {
    title: "Browse cars | Sheggar Wheels",
    description: "Find a rental car in Addis Ababa.",
    url: "/cars",
    // Share image shows the first car in the default catalogue order (newest approved listing).
    images: [{ url: "/og/cars.jpg", width: 1200, height: 630, alt: "Cars available on Sheggar Wheels" }],
  },
  twitter: { card: "summary_large_image", title: "Browse cars | Sheggar Wheels", images: ["/og/cars.jpg"] },
};

// The server renders the first view from the seed data for a fast first paint; the client then swaps in
// the visitor's real browser data. Filters live in the URL.
export default async function CarsPage({ searchParams }) {
  await searchParams; // reading it makes the route dynamic: the server renders the filtered list
  return (
    <Suspense fallback={<div className="container section"><PageLoading label="Loading catalogue…" /></div>}>
      <CatalogueClient />
    </Suspense>
  );
}
