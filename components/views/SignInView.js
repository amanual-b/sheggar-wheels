"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@/components/Form";
import { PageLoading } from "@/components/States";
import { useToast } from "@/components/Toast";
import { refreshData, useData, useSession } from "@/lib/hooks";
import { defaultLanding, hasRole, safeReturnPath, signInAsDemo, signInWithEmail, signOut } from "@/lib/session";
import { initials } from "@/lib/format";

const GROUPS = [
  { title: "Owners", test: (u) => u.roles.includes("owner") && u.roles.includes("renter") && u.status === "active" },
  { title: "Renters", test: (u) => u.roles.length === 1 && u.roles[0] === "renter" && u.status === "active" },
  { title: "Administrator", test: (u) => hasRole(u, "admin") },
  { title: "Suspended account", test: (u) => u.status === "suspended" },
];

export default function SignInView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { users, loading } = useData();
  const { user: current } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const rawNext = params.get("next");
  // Always sanitise: external or malformed targets collapse to "/".
  const hasNext = rawNext !== null && rawNext !== "";
  const safeNext = hasNext ? safeReturnPath(rawNext) : null;

  const finish = (result) => {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refreshData();
    toast.success(`Signed in as ${result.data.name}.`);
    router.push(safeNext ?? defaultLanding(result.data));
  };

  return (
    <div className="container section" style={{ maxWidth: 1000 }}>
      <h1>Sign in</h1>
      <p className="muted">
        Pick an account to continue, or enter your email. No password is required in this version. Your session ends when you sign out or close the tab.
      </p>
      {safeNext && safeNext !== "/" ? (
        <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
          <b>Please sign in to continue</b>
          After signing in you will return to <code>{safeNext}</code>.
        </div>
      ) : null}
      {hasNext && safeNext === "/" ? (
        <div className="alert alert-warning" role="status" style={{ marginBottom: 16 }}>
          <b>Return address ignored</b>
          Only pages on this site are allowed as a return address, so you will land on the home page.
        </div>
      ) : null}
      {current ? (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <b>You are already signed in as {current.name}.</b>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <Link className="btn btn-primary btn-sm" href={safeNext ?? defaultLanding(current)}>Continue</Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { signOut(); refreshData(); }}>Switch account</button>
          </div>
        </div>
      ) : null}

      <div className="auth-wrap">
        <section className="card card-body stack" aria-labelledby="pick">
          <h2 id="pick" style={{ fontSize: "1.2rem" }}>Choose an account</h2>
          {loading ? <PageLoading label="Loading accounts…" /> : null}
          {GROUPS.map((g) => {
            const list = users.filter(g.test);
            if (!list.length) return null;
            return (
              <div key={g.title} className="stack" style={{ gap: 8 }}>
                <div className="label">{g.title}</div>
                {list.map((u) => (
                  <button key={u.id} type="button" className="account-card" onClick={() => finish(signInAsDemo(u.id))}>
                    <span className="avatar" aria-hidden="true">{initials(u.name)}</span>
                    <span>
                      <b>{u.name}</b>
                      <small>{u.email} · {u.roles.join(" + ")}</small>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </section>

        <section className="card card-body stack" aria-labelledby="email-signin">
          <h2 id="email-signin" style={{ fontSize: "1.2rem" }}>Or use your email</h2>
          <form
            className="stack"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              finish(signInWithEmail(email));
            }}
          >
            <TextField label="Email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} error={error} hint="Example: meron@example.com" />
            <button type="submit" className="btn btn-primary">Sign in</button>
          </form>
          <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />
          <p style={{ margin: 0 }}>New here? <Link href={safeNext ? `/signup?next=${encodeURIComponent(safeNext)}` : "/signup"}>Create an account</Link>.</p>
          <p className="hint" style={{ margin: 0 }}>Quick sign-in is used in this version; there is no password check.</p>
        </section>
      </div>
    </div>
  );
}
