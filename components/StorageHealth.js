"use client";
import { useEffect, useState } from "react";
import { useStorageHealth, refreshData } from "@/lib/hooks";
import { resetDemoData } from "@/lib/data";

/** Clear recovery message when storage is unavailable or saved JSON is malformed. */
export default function StorageHealth() {
  // Parsing every saved collection is not urgent: wait until the browser is idle.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const go = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 800);
    return () => clearTimeout(t);
  }, []);
  const health = useStorageHealth(ready);

  if (!health) return null;
  if (!health.available) {
    return (
      <div className="container" style={{ marginTop: 12 }}>
        <div className="alert alert-error" role="alert">
          <b>Browser storage is unavailable</b>
          Sheggar Wheels saves its data in your browser. Enable site data / cookies (or leave private mode) and reload the page.
        </div>
      </div>
    );
  }
  if (health.issues.length) {
    return (
      <div className="container" style={{ marginTop: 12 }}>
        <div className="alert alert-warning" role="alert">
          <b>Some saved data could not be read</b>
          Affected: {health.issues.join(", ")}. The app keeps working with empty lists for those parts.
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                resetDemoData();
                refreshData();
              }}
            >
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
