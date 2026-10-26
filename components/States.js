import Link from "next/link";

export function PageLoading({ label = "Loading…" }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children, actionHref, actionLabel, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action || (actionHref ? <Link className="btn btn-primary" href={actionHref}>{actionLabel}</Link> : null)}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", children, actionHref, actionLabel }) {
  return (
    <div className="alert alert-error" role="alert">
      <b>{title}</b>
      {children}
      {actionHref ? (
        <div style={{ marginTop: 10 }}>
          <Link className="btn btn-secondary btn-sm" href={actionHref}>{actionLabel}</Link>
        </div>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 style={{ fontSize: "clamp(1.5rem, 2vw + 1rem, 2.1rem)" }}>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="btn-row">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, sub, tone }) {
  return (
    <div className="card stat-card" style={tone ? { borderLeftColor: tone } : undefined}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
