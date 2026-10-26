"use client";
// Leaflet is imported only in the browser (this file is loaded via next/dynamic with ssr:false).
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function pin(extra = "") {
  return L.divIcon({ className: "", html: `<div class="sw-marker ${extra}"></div>`, iconSize: [30, 30], iconAnchor: [15, 30] });
}

export default function CarMapInner({ lat, lng, label, path, moving }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const movingRef = useRef(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lng], path ? 12 : 14);
    mapRef.current = map;
    const tiles = L.tileLayer(TILE_URL, { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    L.marker([lat, lng], { icon: pin(), title: label, keyboard: false }).addTo(map).bindPopup(label);
    if (path && path.length > 1) {
      const line = L.polyline(path, { color: "#7c3aed", weight: 4, dashArray: "8 8" }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
    return () => {
      map.remove();
      mapRef.current = null;
      movingRef.current = null;
    };
  }, [lat, lng, label, path]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !moving) return;
    if (!movingRef.current) movingRef.current = L.marker(moving, { icon: pin("moving"), title: "Route preview position", keyboard: false }).addTo(map);
    else movingRef.current.setLatLng(moving);
  }, [moving]);

  return (
    <div>
      <div ref={elRef} className="map-box" role="application" aria-label={`Map showing ${label}`} />
      {tileError ? <p className="map-note" role="status">Map tiles could not load (offline or blocked). The address above still shows the area.</p> : null}
    </div>
  );
}
