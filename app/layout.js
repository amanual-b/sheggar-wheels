import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import { SITE_URL } from "@/lib/site";

// next/font self-hosts the font at build time (no runtime request to Google).
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });


const baseUrl = process.env.SITE_URL 
  ? process.env.SITE_URL.startsWith('http') ? process.env.SITE_URL : `https://${process.env.SITE_URL}`
  : "https://sheggar-wheels-pi.vercel.app/";

export const metadata = {
  metadataBase: new URL(baseUrl), 
  title: { 
    default: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa", 
    template: "%s | Sheggar Wheels" 
  }, 
  description: "Rent a car from local owners in Addis Ababa, or earn from your own. Browse cars, request a trip and manage your listings.", 
  
  openGraph: { 
    type: "website", 
    siteName: "Sheggar Wheels", 
    title: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa", 
    description: "Browse cars, request bookings and manage listings.", 
    images: [{ 
      url: "/og/default.jpg",
      width: 1200, 
      height: 630, 
      alt: "Sheggar Wheels - rent a car in Addis Ababa" 
    }], 
  }, 
  twitter: { 
    card: "summary_large_image", 
    images: ["/og/default.jpg"] 
  }, 
};


export const viewport = { themeColor: "#6d28d9", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
