import Image from "next/image";
import Link from "next/link";
import FeaturedCars from "@/components/FeaturedCars";
import { NEIGHBOURHOODS } from "@/lib/constants";
import { canonicalFor } from "@/lib/site";

export const metadata = {
  title: { absolute: "Sheggar Wheels | Peer-to-peer car rental in Addis Ababa" },
  description: "Rent a car from local owners in Addis Ababa or earn from your own car. Browse listings, request a booking and manage trips.",
  alternates: canonicalFor("/"),
  openGraph: { title: "Sheggar Wheels", description: "Peer-to-peer car rental for Addis Ababa.", url: "/", images: [{ url: "/og/default.jpg", width: 1200, height: 630, alt: "Sheggar Wheels" }] },
  twitter: { card: "summary_large_image", images: ["/og/default.jpg"] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sheggar Wheels",
  description: "Peer-to-peer car rental marketplace for Addis Ababa.",
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div>
            <span className="badge badge-purple" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>Peer-to-peer · Addis Ababa</span>
            <h1 id="hero-title" style={{ marginTop: 14 }}>Rent a car from your <em>neighbour</em>, not a showroom.</h1>
            <p className="lead">Sheggar Wheels connects people who need a car with owners whose cars sit idle. Compare listings, pick your dates and request a trip in minutes.</p>
            <form className="search-card" action="/cars" method="get" aria-label="Search cars">
              <div className="field span-2">
                <label className="label" htmlFor="hero-q">What are you looking for?</label>
                <input className="input" id="hero-q" name="q" placeholder="Make or model, e.g. Tucson" maxLength={60} />
              </div>
              <div className="field">
                <label className="label" htmlFor="hero-n">Neighbourhood</label>
                <select className="select" id="hero-n" name="neighbourhood" defaultValue="">
                  <option value="">Anywhere</option>
                  {NEIGHBOURHOODS.map((n) => <option key={n.name} value={n.name}>{n.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="hero-from">From</label>
                <input className="input" id="hero-from" name="from" type="date" />
              </div>
              <div className="field">
                <label className="label" htmlFor="hero-to">To</label>
                <input className="input" id="hero-to" name="to" type="date" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "end" }}>Search cars</button>
            </form>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="shot a"><Image src="/cars/tesla_model_31.jpg" alt="" fill sizes="(max-width: 900px) 0px, 360px" style={{ objectFit: "cover" }} /></div>
            <div className="shot b"><Image src="/cars/byd_atto_31.jpg" alt="" fill sizes="(max-width: 900px) 0px, 360px" style={{ objectFit: "cover" }} /></div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stat-strip">
          <div className="card stat-card"><div className="stat-value">7+</div><div className="stat-label">Cars to browse</div></div>
          <div className="card stat-card"><div className="stat-value">10</div><div className="stat-label">Addis neighbourhoods</div></div>
          <div className="card stat-card"><div className="stat-value">10%</div><div className="stat-label">Service fee, shown up front</div></div>
          <div className="card stat-card"><div className="stat-value">2+</div><div className="stat-label">Photos on every listing</div></div>
        </div>
      </div>

      <section className="section" aria-labelledby="featured">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div>
              <h2 id="featured">Popular right now</h2>
              <p className="muted" style={{ margin: 0 }}>Most-requested cars on Sheggar Wheels.</p>
            </div>
            <Link className="btn btn-secondary" href="/cars">View all cars</Link>
          </div>
          <FeaturedCars />
        </div>
      </section>

      <section className="section defer" id="how" aria-labelledby="how-title" style={{ background: "#fff", borderBlock: "1px solid var(--line)" }}>
        <div className="container">
          <h2 id="how-title" className="center">How it works</h2>
          <p className="muted center">Three steps from search to keys.</p>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            <div className="card step"><div className="num">1</div><h3>Find a car</h3><p className="muted">Search by make, neighbourhood, price and dates. Every listing shows photos, specs and a sample pickup area.</p></div>
            <div className="card step"><div className="num">2</div><h3>Request your dates</h3><p className="muted">See the full price before you confirm, pay with TeleBirr (held until the owner approves) and wait for the owner to respond.</p></div>
            <div className="card step"><div className="num">3</div><h3>Drive and review</h3><p className="muted">Follow your booking status, follow your trip, then leave a review once the car is returned.</p></div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="owners">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 id="owners">Got a car sitting idle?</h2>
              <p>Create an account, tick “I also want to list my car” and publish a listing. Admins review it before it goes public.</p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-light" href="/signup">Create an account</Link>
              <Link className="btn btn-ghost" style={{ color: "#fff" }} href="/signin">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
