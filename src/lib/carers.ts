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
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "under_review" | "approved" | "rejected" | "cancelled" | "no_show";
  instructions: string;
  notes: string;
  requiredSkills: string[];
  checklistCompletion: number;
  checklistItems: CarerVisitChecklistItem[];
  evidence: CarerVisitEvidence[];
  incidents: CarerVisitIncident[];
};

export type CarerWorkspaceRecord = {
  carerId: string;
  carerName: string;
  availability: string;
  credentials: string[];
  visits: CarerAssignedVisit[];
};
