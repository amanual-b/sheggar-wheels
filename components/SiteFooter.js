import Link from "next/link";
import Brand from "@/components/Brand";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ filter: "brightness(0) invert(1)", display: "inline-block" }}>
              <Brand />
            </div>
            <p style={{ marginTop: 12, maxWidth: "46ch" }}>
              Peer-to-peer car rental in Addis Ababa. Rent a car from local owners, or earn from the one sitting in your driveway.
            </p>
          </div>
          <div>
            <h2>Explore</h2>
            <ul>
              <li><Link href="/cars">Browse cars</Link></li>
              <li><Link href="/signup">Create an account</Link></li>
              <li><Link href="/signin">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><Link href="/#how">How it works</Link></li>
              <li><Link href="/guardrails">Safety checks</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sheggar Wheels</span>
          <span>Addis Ababa, Ethiopia</span>
        </div>
      </div>
    </footer>
  );
}
