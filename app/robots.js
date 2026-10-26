import { SITE_URL } from "@/lib/site";

// Crawler guidance only - this is NOT access control.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/bookings", "/checkout", "/owner", "/admin", "/signin", "/signup"] }],
    ...(SITE_URL ? { sitemap: `${SITE_URL}/sitemap.xml` } : {}),
  };
}
