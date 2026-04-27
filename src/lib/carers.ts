export type CarerVisitChecklistItem = {
  id?: string;
  templateItemId: string;
  label: string;
  result: "pending" | "pass" | "fail" | "not_applicable";
  note?: string;
};

export type CarerVisitEvidence = {
  id: string;
  kind: string;
  fileUrl: string;
  capturedAt?: string;
};

export type CarerVisitIncident = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  occurredAt: string;
};

export type CarerCredentialRecord = {
  id: string;
  code: string;
  name: string;
  status: "pending" | "valid" | "expired" | "rejected";
  issuedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
  daysToExpiry?: number;
  isExpiringSoon: boolean;
  expiryState: "no_expiry" | "current" | "expiring_soon" | "expired";
  expirySummary: string;
  matchingImpact: string;
  renewalAction: string;
};

export type CarerAlert = {
  id: string;
  tone: "neutral" | "warning" | "critical";
  title: string;
  detail: string;
};

export type CarerReadinessSignal = {
  id: string;
  tone: "positive" | "neutral" | "warning" | "critical";
  label: string;
  detail: string;
};

export type CarerReadinessSummary = {
  status: "ready" | "restricted" | "attention_needed";
  headline: string;
  operationalImpact: string;
  positiveSignals: CarerReadinessSignal[];
  attentionSignals: CarerReadinessSignal[];
  blockerSignals: CarerReadinessSignal[];
};

export type CarerAvailabilityBlockRecord = {
  id: string;
  startsAt: string;
  endsAt: string;
  isWorking: boolean;
};

export type CarerAssignedVisit = {
  id: string;
  label: string;
  orderCode: string;
  orderTitle: string;
  serviceType: string;
  centerName: string;
  facilityName: string;
  recipientName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "under_review" | "approved" | "rejected" | "cancelled" | "no_show";
  instructions: string;
  notes: string;
  requiredSkills: string[];
  checklistCompletion: number;
  checklistItems: CarerVisitChecklistItem[];
  evidence: CarerVisitEvidence[];
  incidents: CarerVisitIncident[];
  executionReadiness: {
    checklistComplete: boolean;
    evidenceCaptured: boolean;
    incidentCount: number;
    summary: string;
    reviewBlockers: string[];
  };
};

export type CarerWorkspaceRecord = {
  carerId: string;
  carerName: string;
  availability: string;
  readinessStatus: "ready" | "restricted" | "attention_needed";
  readinessSummary: CarerReadinessSummary;
  verifiedSkills: string[];
  opportunityLimits: string[];
  alerts: CarerAlert[];
  credentials: CarerCredentialRecord[];
  availabilityBlocks: CarerAvailabilityBlockRecord[];
  visits: CarerAssignedVisit[];
};
