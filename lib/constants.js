// Sample neighbourhoods with seeded sample coordinates (not real vehicle locations).
export const CITY = "Addis Ababa";

export const NEIGHBOURHOODS = [
  { name: "Bole", lat: 8.9959, lng: 38.7852 },
  { name: "Kazanchis", lat: 9.0166, lng: 38.769 },
  { name: "Piassa", lat: 9.0359, lng: 38.7468 },
  { name: "CMC", lat: 9.019, lng: 38.826 },
  { name: "Megenagna", lat: 9.02, lng: 38.801 },
  { name: "Sarbet", lat: 8.997, lng: 38.729 },
  { name: "Lideta", lat: 9.0105, lng: 38.7283 },
  { name: "Gerji", lat: 9.0, lng: 38.81 },
  { name: "Ayat", lat: 9.03, lng: 38.875 },
  { name: "Old Airport", lat: 8.989, lng: 38.75 },
];

export const TRANSMISSIONS = ["Automatic", "Manual"];
export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];
export const SEAT_OPTIONS = [2, 4, 5, 7];

export const DISPUTE_REASONS = [
  "Vehicle condition",
  "Late return",
  "Damage claim",
  "Cleanliness",
  "Payment issue",
  "Other",
];

export const PAGE_SIZE = 6;
export const HISTORY_PAGE_SIZE = 8;
export const MAX_RENTAL_DAYS = 30;

export const BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "reviewed",
  "declined",
  "cancelled",
  "disputed",
  "resolved",
];

export const STATUS_LABELS = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  reviewed: "Reviewed",
  declined: "Declined",
  cancelled: "Cancelled",
  disputed: "Disputed",
  resolved: "Resolved",
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  inactive: "Inactive",
  active: "Active",
  suspended: "Suspended",
  open: "Open",
  held: "Held",
  paid: "Paid",
  refunded: "Refunded",
};

export const STATUS_TONES = {
  requested: "warning",
  confirmed: "info",
  in_progress: "purple",
  completed: "success",
  reviewed: "success",
  declined: "danger",
  cancelled: "neutral",
  disputed: "danger",
  resolved: "neutral",
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  inactive: "neutral",
  active: "success",
  suspended: "danger",
  open: "warning",
  held: "warning",
  paid: "success",
  refunded: "neutral",
};
