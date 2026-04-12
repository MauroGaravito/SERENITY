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
export type ClosingPeriodStatus = "open" | "locked" | "exported";
export type ExpenseType = "mileage" | "travel" | "supplies" | "other";

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

export type ExpenseRecord = {
  id: string;
  type: ExpenseType;
  amountCents: number;
  currency: string;
  note?: string;
  evidenceUrl?: string;
  createdAt: string;
};

export type ClosingVisitRecord = {
  id: string;
  orderCode: string;
  orderTitle: string;
  recipientName: string;
  serviceType: string;
  carerName?: string;
  status: VisitStatus;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  suggestedApprovedMinutes: number;
  settlementId?: string;
  approvedMinutes?: number;
  billableCents?: number;
  payableCents?: number;
  isReadyForExport: boolean;
  expenses: ExpenseRecord[];
};

export type ClosingPeriodRecord = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  status: ClosingPeriodStatus;
  readyForExport: boolean;
  approvedVisitsCount: number;
  settledVisitsCount: number;
  unsettledVisitsCount: number;
  approvedMinutesTotal: number;
  billableCentsTotal: number;
  payableCentsTotal: number;
  expenseCentsTotal: number;
  visits: ClosingVisitRecord[];
};

export type ClosingWorkspaceRecord = {
  periods: ClosingPeriodRecord[];
  summary: {
    periodsOpen: number;
    visitsReadyForSettlement: number;
    visitsReadyForExport: number;
    approvedMinutesInFlight: number;
  };
};

export type ClosingExportPackage = {
  schemaVersion: string;
  exportBatchId: string;
  generatedAt: string;
  provider: {
    id: string;
    displayName: string;
    legalName: string;
    timezone: string;
  };
  closingPeriod: {
    id: string;
    label: string;
    status: ClosingPeriodStatus;
    startsAt: string;
    endsAt: string;
  };
  totals: {
    visits: number;
    approvedMinutes: number;
    billableCents: number;
    payableCents: number;
    expenseCents: number;
  };
  visits: Array<{
    visitId: string;
    settlementId: string;
    serviceOrderId: string;
    orderCode: string;
    orderTitle: string;
    recipientId: string;
    recipientExternalRef?: string;
    recipientName: string;
    assignedCarerId?: string;
    carerName?: string;
    serviceType: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    approvedMinutes: number;
    billableCents: number;
    payableCents: number;
    currency: string;
    expenses: ExpenseRecord[];
  }>;
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

export function formatCurrency(valueCents: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency
  }).format(valueCents / 100);
}

export function getStatusTone(
  status: OrderStatus | VisitStatus | ReviewOutcome | ClosingPeriodStatus
) {
  switch (status) {
    case "approved":
    case "closed":
    case "exported":
      return "positive";
    case "under_review":
    case "partially_assigned":
    case "needs_changes":
    case "locked":
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
