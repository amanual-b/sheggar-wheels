"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const CarMapInner = dynamic(() => import("@/components/CarMapInner"), {
  ssr: false,
  loading: () => (
    <div className="map-box loading" role="status">Loading map…</div>
  ),
});

/**
 * Leaflet map with a non-map fallback. Coordinates are seeded SAMPLE points,
 * never live GPS. Tiles come from an external provider (OpenStreetMap by default).
 */
export default function CarMap({ lat, lng, label, neighbourhood, city, path, moving, simulation = false }) {
  // Leaflet and the map tiles are only fetched when the map is about to scroll into view.
  const holder = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  return (
    <div>
      <p style={{ marginBottom: 8 }}>
        <b>{neighbourhood}</b>, {city}
        <span className="muted small"> · approx. {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</span>
      </p>
      <div ref={holder}>
        {visible ? <CarMapInner lat={lat} lng={lng} label={label} path={path} moving={moving} /> : <div className="map-box loading" role="status">Map loads as you scroll…</div>}
      </div>
      <p className="map-note">
        {simulation ? "Route preview: the marker follows a sample route. It is not live GPS tracking. " : "Approximate pickup area, not the live position of the car. "}
        Map tiles © OpenStreetMap contributors. <a href={osm} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a>
      </p>
    </div>
  );
}
