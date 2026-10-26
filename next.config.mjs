/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Optimised car photos never change for a given URL, so let browsers/CDNs keep them for a year.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ["recharts"],
  },
  async headers() {
    const week = "public, max-age=604800, stale-while-revalidate=86400";
    return [
      { source: "/cars/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/og/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: week }] },
    ];
  },
};

export default nextConfig;
