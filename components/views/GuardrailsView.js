"use client";
import { useState } from "react";
import Link from "next/link";
import { refreshData } from "@/lib/hooks";
import { runNegativeTests } from "@/lib/negativeTests";
import { initializeDemoData, resetDemoData } from "@/lib/data";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

export default function GuardrailsView() {
  const [results, setResults] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();

  const run = () => {
    initializeDemoData();
    setResults(runNegativeTests());
    refreshData();
  };
  const passed = results ? results.filter((r) => r.passed).length : 0;

  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <h1>Safety checks</h1>
      <div className="alert alert-warning" style={{ marginBottom: 16 }}>
        <b>These checks are not real security.</b>
        Browser storage can be edited by anyone using developer tools. The tests below prove that ordinary misuse through the app is refused safely. Real enforcement must live on a server.
      </div>
      <p>
        Each check temporarily switches the signed-in account, tries a forbidden action using the same functions the buttons call, checks that stored data did not change, then restores your session.
        You can also try the unsafe return URL by hand: <Link href="/signin?next=https://example.com">/signin?next=https://example.com</Link>.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={run}>Run all safety checks</button>
        <button type="button" className="btn btn-secondary" onClick={() => setConfirm(true)}>Reset saved data</button>
      </div>

      {results ? (
        <section className="card" style={{ marginTop: 20 }} aria-live="polite" aria-label="Test results">
          <div className="card-head">
            <h2>{passed} of {results.length} passed</h2>
            <span className={`badge ${passed === results.length ? "badge-success" : "badge-danger"}`}>{passed === results.length ? "All refused safely" : "Check failures"}</span>
          </div>
          <div>
            {results.map((r, i) => (
              <div key={r.id + "-" + i} className="test-row" style={i === 0 ? { borderTop: 0 } : undefined}>
                <span className={`badge ${r.passed ? "badge-success" : "badge-danger"}`}>{r.passed ? "PASS" : "FAIL"}</span>
                <div>
                  <b>{r.title}</b>
                  <div className="muted small">Expected: {r.expected}</div>
                  <div className="small">Result: {r.actual}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset saved data?"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetDemoData();
                refreshData();
                setConfirm(false);
                setResults(null);
                toast.success("Saved data was reset to the original listings and accounts.");
              }}
            >
              Reset everything
            </button>
          </>
        }
      >
        <p>This erases every change made in this browser (bookings, listings, accounts) and restores the original listings and accounts. You will be signed out.</p>
      </Modal>
    </div>
  );
}
