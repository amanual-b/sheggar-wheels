import { buildSeed } from "@/lib/seed";
import { SITE_URL } from "@/lib/site";

// Public routes + the seeded approved cars. Cars created in a visitor's browser cannot be listed here.
export default function sitemap() {
  const base = SITE_URL || "http://localhost:3000";
  const now = new Date();
  const cars = buildSeed().cars.filter((c) => c.status === "approved");
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cars`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...cars.map((c) => ({ url: `${base}/cars/${c.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 })),
  ];
}
