"use client";

import { Fragment } from "react";
import Link from "next/link";

function windowed(page, total) {
  const set = new Set([1, total, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/** Visible page links with a clear current-page indicator. Use hrefFor (URL) or onChange (state). */
export default function Pagination({ page, totalPages, hrefFor, onChange, label = "Pagination" }) {
  if (totalPages <= 1) return null;

  const control = (n, content, extra = {}) =>
    hrefFor ? (
      <Link
        href={hrefFor(n)}
        scroll={false}
        className="page-link"
        onClick={onChange ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); onChange(n); } : undefined}
        {...extra}
      >
        {content}
      </Link>
    ) : (
      <button type="button" onClick={() => onChange(n)} className="page-link" {...extra}>
        {content}
      </button>
    );

  const disabled = (content) => (
    <span className="page-link" aria-disabled="true">
      {content}
    </span>
  );

  return (
    <nav className="pagination" aria-label={label}>
      {page <= 1 ? disabled("‹ Prev") : control(page - 1, "‹ Prev", { "aria-label": "Previous page" })}
      {windowed(page, totalPages).map((n) =>
        typeof n === "string" ? (
          <span key={n} aria-hidden="true" className="muted">…</span>
        ) : (
          <Fragment key={n}>
            {control(n, n, { "aria-current": n === page ? "page" : undefined, "aria-label": `Page ${n}${n === page ? " (current page)" : ""}` })}
          </Fragment>
        )
      )}
      {page >= totalPages ? disabled("Next ›") : control(page + 1, "Next ›", { "aria-label": "Next page" })}
      <span className="sr-only" aria-live="polite">Page {page} of {totalPages}</span>
    </nav>
  );
}
