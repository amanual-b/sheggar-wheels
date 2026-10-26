import CarDetailClient from "@/components/CarDetailClient";
import { SEED_CAR_IDS, findSeedCar } from "@/lib/seed";
import { SITE_URL, canonicalFor } from "@/lib/site";

// Seeded cars are pre-rendered. Any other id still renders on demand (the client looks it up in localStorage).
export function generateStaticParams() {
  return SEED_CAR_IDS.map((id) => ({ id }));
}

// Metadata can only use data the server knows: the seed. Cars created in a browser get generic metadata.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const car = findSeedCar(id);
  if (!car || car.status !== "approved") return { title: "Car details", robots: { index: false } };
  const title = `${car.make} ${car.model} ${car.year} for rent in ${car.neighbourhood}`;
  const description = `${car.make} ${car.model} (${car.transmission}, ${car.seats} seats) from ETB ${car.pricePerDay} per day in ${car.neighbourhood}, Addis Ababa. `;
  return {
    title,
    description,
    alternates: canonicalFor(`/cars/${id}`),
    openGraph: { title, description, url: `/cars/${id}`, type: "website", images: [{ url: `/og/${id}.jpg`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`/og/${id}.jpg`] },
  };
}

export default async function CarPage({ params }) {
  const { id } = await params;
  const car = findSeedCar(id);
  // Truthful structured data: only fields we actually have. No invented ratings or reviews.
  const jsonLd =
    car && car.status === "approved"
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${car.make} ${car.model} ${car.year}`,
          description: car.description,
          image: car.photos.map((p) => `${SITE_URL}${p}`),
          category: "Car rental",
          offers: { "@type": "Offer", price: car.pricePerDay, priceCurrency: "ETB", availability: "https://schema.org/InStock" },
        }
      : null;
  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <CarDetailClient id={id} />
    </>
  );
}
