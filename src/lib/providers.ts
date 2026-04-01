export type OrderStatus =
  | "draft"
  | "open"
  | "partially_assigned"
  | "assigned"
  | "active"
  | "completed"
  | "closed"
  | "cancelled";

export type VisitStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "no_show";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type ReviewOutcome = "approved" | "needs_changes" | "rejected";
export type Tone = "neutral" | "warning" | "critical" | "positive";

export type CarerOption = {
  id: string;
  name: string;
  credentials: string[];
  availability: string;
  rating: number;
};

export type VisitReview = {
  reviewer: string;
  outcome: ReviewOutcome;
  at: string;
  note: string;
};

export type VisitIncident = {
  id: string;
  category: string;
  severity: IncidentSeverity;
  summary: string;
};

export type VisitRecord = {
  id: string;
  label: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: VisitStatus;
  assignedCarerId?: string;
  assignedCarerName?: string;
  checklistCompletion: number;
  evidenceCount: number;
  notes: string;
  incident?: VisitIncident;
  review?: VisitReview;
};

export type ServiceOrderRecord = {
  id: string;
  code: string;
  title: string;
  centerName: string;
  facilityName: string;
  recipientName: string;
  serviceType: string;
  status: OrderStatus;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  requiredLanguage?: string;
  frequency: string;
  plannedDurationMin: number;
  coverageRisk: "stable" | "warning" | "critical";
  instructions: string;
  notesForCoordinator: string;
  visits: VisitRecord[];
  eligibleCarers: CarerOption[];
};

export type ProviderMetric = {
  label: string;
  value: string;
  tone: Tone;
  detail: string;
};

export type AuditEventRecord = {
  id: string;
  type:
    | "order_created"
    | "order_updated"
    | "visit_created"
    | "visit_assigned"
    | "visit_status_changed"
    | "visit_reviewed";
  summary: string;
  createdAt: string;
  actorName?: string;
  actorRole?: string;
};

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getStatusTone(status: OrderStatus | VisitStatus | ReviewOutcome) {
  switch (status) {
    case "approved":
    case "closed":
      return "positive";
    case "under_review":
    case "partially_assigned":
    case "needs_changes":
      return "warning";
    case "rejected":
    case "cancelled":
    case "no_show":
      return "critical";
    default:
      return "neutral";
  }
}

export function toTitleCase(value: string): string {
  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
