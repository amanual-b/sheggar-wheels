"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="container section" style={{ maxWidth: 640 }}>
      <div className="alert alert-error" role="alert">
        <b>Something went wrong</b>
        This page hit an unexpected error. If you edited your browser data by hand, resetting the saved data usually fixes it.
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>Try again</button>
        <a className="btn btn-secondary" href="/">Go home</a>
      </div>
    </main>
  );
}
