"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import ReviewForm from "@/components/ReviewForm";
import StatusBadge from "@/components/StatusBadge";
import { SelectField, TextAreaField } from "@/components/Form";
import { ErrorState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData, useRenterBooking, useSession } from "@/lib/hooks";
import { ACTION_LABELS, cancelBooking, getAllowedActions } from "@/lib/bookings";
import { openDispute } from "@/lib/disputes";
import { DISPUTE_REASONS, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateRange, formatDateTime, formatETB } from "@/lib/format";

export default function BookingDetailView({ id }) {
  const res = useRenterBooking(id);
  const { user } = useSession();
  const { carById, userById, disputes, reviews, loading } = useData();
  const params = useSearchParams();
  const run = useAction();
  const [modal, setModal] = useState(null); // 'cancel' | 'issue'
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isNew, setIsNew] = useState(false);

  useEffect(() => setIsNew(params.get("new") === "1"), [params]);

  if (res === undefined || loading || !user) return <PageLoading label="Loading booking…" />;
  if (!res.ok) {
    const denied = res.error === "Not yours";
    return (
      <ErrorState title={denied ? "You can't view this booking" : res.error} actionHref="/bookings" actionLabel="Back to my bookings">
        {denied ? "This booking belongs to another account." : "It may have been removed from the data saved in this browser."}
      </ErrorState>
    );
  }

  const b = res.data;
  const car = carById.get(b.carId);
  const owner = userById.get(b.ownerId);
  const allowed = getAllowedActions(b, user);
  const dispute = disputes.find((d) => d.bookingId === b.id);
  const review = reviews.find((r) => r.bookingId === b.id);
  const carName = car ? `${car.make} ${car.model} ${car.year}` : "this trip";
  const close = () => { setModal(null); setFormError(""); };

  const doCancel = () => {
    if (run(cancelBooking(b.id), "Booking cancelled. Your held payment is marked refunded.")) close();
    else close();
  };
  const doIssue = (e) => {
    e.preventDefault();
    const result = openDispute({ bookingId: b.id, reason, description });
    if (!result.ok) return setFormError(result.error);
    run(result, "Issue raised. An admin will review it.");
    setDescription("");
    setReason("");
    close();
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title={car ? `${car.make} ${car.model}` : "Booking"}
        subtitle={`Booking ${b.id}`}
        actions={
          <>
            {allowed.includes("cancel") ? <button type="button" className="btn btn-secondary" onClick={() => setModal("cancel")}>{ACTION_LABELS.cancel}</button> : null}
            {allowed.includes("raise_issue") ? <button type="button" className="btn btn-secondary" onClick={() => setModal("issue")}>{ACTION_LABELS.raise_issue}</button> : null}
            {b.status === "in_progress" ? <Link className="btn btn-primary" href={`/bookings/${b.id}/track`}>Track trip</Link> : null}
            {allowed.includes("review") ? <a className="btn btn-primary" href="#review">{ACTION_LABELS.review}</a> : null}
          </>
        }
      />
      {isNew ? (
        <div className="alert alert-success" role="status"><b>Request sent!</b>The owner has been notified. You will see the status change here once they respond. This is your receipt.</div>
      ) : null}
      {b.status === "requested" ? <div className="alert alert-info"><b>Waiting for the owner</b>Your payment is held until the owner approves or declines.</div> : null}
      {b.status === "declined" ? <div className="alert alert-warning"><b>Request declined</b>The owner could not accept these dates. Your payment was refunded.</div> : null}

      <div className="grid grid-2">
        <section className="receipt" aria-labelledby="receipt-title">
          <div className="row-between">
            <h2 id="receipt-title" style={{ fontSize: "1.2rem" }}>Receipt</h2>
            <StatusBadge status={b.status} />
          </div>
          
          <dl className="kv">
            <dt>Car</dt><dd>{car ? `${car.make} ${car.model} ${car.year}` : "Unknown"}</dd>
            <dt>Dates</dt><dd>{formatDateRange(b.startDate, b.endDate)} ({b.days} {b.days === 1 ? "day" : "days"})</dd>
            <dt>Owner</dt><dd>{owner?.name || "Unknown"}</dd>
            <dt>Pickup</dt><dd>{car ? `${car.neighbourhood}, ${car.city}` : "-"}</dd>
            <dt>Payment</dt><dd>{(b.paymentMethod || "TeleBirr").replace(" (demo)", "")} · <StatusBadge status={b.paymentStatus} /></dd>
            <dt>Reference</dt><dd><code>{b.paymentRef}</code></dd>
            <dt>Requested</dt><dd>{formatDateTime(b.createdAt)}</dd>
          </dl>
          <hr style={{ border: 0, borderTop: "1px dashed var(--p-300)", margin: "14px 0" }} />
          <div className="price-lines">
            <div><span>{formatETB(b.pricePerDay)} × {b.days}</span><span>{formatETB(b.subtotal)}</span></div>
            <div><span>Service fee</span><span>{formatETB(b.fee)}</span></div>
            <div className="total"><span>Total</span><span>{formatETB(b.total)}</span></div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm no-print" style={{ marginTop: 14 }} onClick={() => window.print()}>Print receipt</button>
        </section>

        <section className="card card-body" aria-labelledby="timeline-title">
          <h2 id="timeline-title" style={{ fontSize: "1.2rem" }}>Status timeline</h2>
          <ol className="timeline">
            {b.statusHistory.map((h, i) => (
              <li key={`${h.status}-${i}`}>
                <b>{STATUS_LABELS[h.status] || h.status}</b>
                <div className="muted small">{formatDateTime(h.at)}</div>
              </li>
            ))}
          </ol>
          {dispute ? (
            <div className="msg">
              <b>Dispute: {dispute.reason}</b> <StatusBadge status={dispute.status} />
              <p className="small" style={{ margin: "6px 0 0" }}>{dispute.description}</p>
              {dispute.resolutionNotes ? <p className="small" style={{ margin: "6px 0 0" }}><b>Resolution:</b> {dispute.resolutionNotes} ({formatDate(dispute.resolvedAt.slice(0, 10))})</p> : null}
            </div>
          ) : null}
        </section>
      </div>

      {b.status === "completed" ? (
        <section className="card card-body stack" id="review" aria-labelledby="review-title" style={{ scrollMarginTop: 90 }}>
          <div>
            <h2 id="review-title" style={{ fontSize: "1.2rem" }}>How was your trip?</h2>
            <p className="muted" style={{ margin: 0 }}>Add one review for this booking. It appears on the car's page and the owner can reply.</p>
          </div>
          <ReviewForm booking={b} carName={carName} />
        </section>
      ) : null}
      {review ? (
        <section className="card card-body stack" aria-labelledby="my-review">
          <div className="row-between">
            <h2 id="my-review" style={{ fontSize: "1.2rem" }}>Your review</h2>
            <span className="rating" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
          </div>
          <p style={{ margin: 0 }}>{review.comment}</p>
          <span className="muted small">Published {formatDate(review.createdAt.slice(0, 10))} · one review per booking</span>
          {review.ownerReply ? <div className="msg"><b className="small">Reply from {owner?.name || "the owner"}</b><br />{review.ownerReply}</div> : null}
        </section>
      ) : null}

      <Modal open={modal === "cancel"} onClose={close} title="Cancel this booking?" footer={<><button type="button" className="btn btn-secondary" onClick={close}>Keep booking</button><button type="button" className="btn btn-danger" onClick={doCancel}>Yes, cancel</button></>}>
        <p>Cancelling is final for this request. Your held payment will be refunded.</p>
      </Modal>
      <Modal open={modal === "issue"} onClose={close} title="Raise an issue">
        <form className="stack" onSubmit={doIssue} noValidate>
          {formError ? <div className="alert alert-error" role="alert">{formError}</div> : null}
          <SelectField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Choose a reason…</option>
            {DISPUTE_REASONS.map((r) => <option key={r}>{r}</option>)}
          </SelectField>
          <TextAreaField label="What happened?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} hint="At least 10 characters." />
          <div className="modal-foot" style={{ padding: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit issue</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
