"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useData, useSession } from "@/lib/hooks";
import { buildNotifications } from "@/lib/notifications";
import { KEYS, readStorage, writeStorage } from "@/lib/storage";
import { formatRelative } from "@/lib/format";

/** In-app notification panel derived from demo records. */
export default function NotificationBell() {
  const { user } = useSession();
  const { cars, bookings, disputes, announcements } = useData();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(null);
  const wrapRef = useRef(null);

  const items = useMemo(() => buildNotifications(user, { cars, bookings, disputes, announcements }), [user, cars, bookings, disputes, announcements]);

  useEffect(() => {
    setSeen(readStorage(KEYS.notifSeen, "", { session: true }) || "");
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!user) return null;
  const unread = seen === null ? 0 : items.filter((n) => String(n.at) > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = new Date().toISOString();
      writeStorage(KEYS.notifSeen, now, { session: true });
      setSeen(now);
    }
  };

  return (
    <div className="bell" ref={wrapRef}>
      <button type="button" className="btn btn-ghost" aria-expanded={open} aria-haspopup="true" aria-controls="notif-panel" onClick={toggle}>
        <span aria-hidden="true">🔔</span>
        <span className="sr-only">Notifications{unread ? `, ${unread} new` : ""}</span>
      </button>
      {unread > 0 ? <span className="bell-count" aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
      {open ? (
        <div className="popover" id="notif-panel">
          <h2>Notifications</h2>
          {items.length === 0 ? <p className="muted small" style={{ padding: "0 16px 16px" }}>You are all caught up.</p> : null}
          {items.map((n) => (
            <Link key={n.id} href={n.href} className="notif" onClick={() => setOpen(false)}>
              <b>{n.title}</b>
              <span>{n.body} · {formatRelative(n.at)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
