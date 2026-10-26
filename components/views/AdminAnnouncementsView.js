"use client";
import { useState } from "react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { TextAreaField, TextField } from "@/components/Form";
import { EmptyState, PageHeader, PageLoading } from "@/components/States";
import { useAction } from "@/components/Toast";
import { useData } from "@/lib/hooks";
import { publishAnnouncement, setAnnouncementActive } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export default function AdminAnnouncementsView() {
  const { announcements, loading } = useData();
  const run = useAction();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (loading) return <PageLoading label="Loading announcements…" />;
  const rows = [...announcements].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return (
    <div className="stack-lg">
      <PageHeader title="Announcements" subtitle="The newest active announcement shows at the top of every page." />
      <form
        className="card card-body stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const res = publishAnnouncement({ title, message });
          if (!res.ok) return setError(res.error);
          setError("");
          setTitle("");
          setMessage("");
          run(res, "Announcement published.");
        }}
      >
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>New announcement</h2>
        {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <TextAreaField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={400} hint={`${message.length}/400`} />
        <div><button type="submit" className="btn btn-primary">Publish</button></div>
      </form>
      <DataTable
        caption="Announcements"
        rows={rows}
        getKey={(a) => a.id}
        empty={<EmptyState title="No announcements yet" />}
        columns={[
          { header: "Title", cell: (a) => <div><b>{a.title}</b><div className="muted small">{a.message}</div></div> },
          { header: "Created", cell: (a) => formatDateTime(a.createdAt) },
          { header: "Status", cell: (a) => <StatusBadge status={a.active ? "active" : "inactive"} /> },
          { header: "Action", cell: (a) => <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(setAnnouncementActive(a.id, !a.active), a.active ? "Announcement deactivated." : "Announcement activated.")}>{a.active ? "Deactivate" : "Activate"}<span className="sr-only"> {a.title}</span></button> },
        ]}
      />
    </div>
  );
}
