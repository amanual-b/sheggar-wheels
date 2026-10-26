"use client";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { TextAreaField } from "@/components/Form";
import { useAction } from "@/components/Toast";
import { addDisputeMessage } from "@/lib/disputes";
import { formatDateTime } from "@/lib/format";

/** Dispute summary + message thread. `canReply` shows the reply form for renter/owner parties. */
export default function DisputeThread({ dispute, userById, currentUserId, canReply = false }) {
  const run = useAction();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const name = (id) => userById.get(id)?.name || "Unknown";

  return (
    <div className="stack">
      <div className="row-between">
        <b>{dispute.reason}</b>
        <StatusBadge status={dispute.status} />
      </div>
      <p style={{ margin: 0 }}>{dispute.description}</p>
      <p className="muted small" style={{ margin: 0 }}>Opened by {name(dispute.openedBy)} · {formatDateTime(dispute.createdAt)}</p>
      {dispute.messages.map((m, i) => (
        <div key={i} className={`msg ${m.by === currentUserId ? "mine" : ""}`}>
          <b className="small">{name(m.by)}</b> <span className="muted small">{formatDateTime(m.at)}</span>
          <div>{m.text}</div>
        </div>
      ))}
      {dispute.status === "resolved" ? (
        <div className="alert alert-success"><b>Resolved by {name(dispute.resolvedBy)}</b>{dispute.resolutionNotes}</div>
      ) : canReply ? (
        <form
          noValidate
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const res = addDisputeMessage(dispute.id, text);
            if (!res.ok) return setError(res.error);
            setError("");
            setText("");
            run(res, "Message added to the dispute.");
          }}
        >
          <TextAreaField label="Add a message" value={text} onChange={(e) => setText(e.target.value)} error={error} maxLength={500} style={{ minHeight: 70 }} />
          <div><button type="submit" className="btn btn-secondary btn-sm">Send message</button></div>
        </form>
      ) : null}
    </div>
  );
}
