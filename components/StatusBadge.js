import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";

export default function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || "neutral";
  return <span className={`badge badge-${tone}`}>{STATUS_LABELS[status] || String(status)}</span>;
}
