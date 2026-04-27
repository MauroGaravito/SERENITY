import {
  ChecklistResult,
  CredentialStatus,
  IncidentSeverity,
  Prisma,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import {
  CarerReadinessSignal,
  CarerVisitChecklistItem,
  CarerWorkspaceRecord
} from "@/lib/carers";
import { prisma } from "@/lib/prisma";

const carerWorkspaceInclude = {
  credentials: {
    orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { name: "asc" }]
  },
  availabilityBlocks: {
    where: {
      endsAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    },
    orderBy: { startsAt: "asc" }
  },
  visits: {
    include: {
      checklistItems: {
        include: {
          templateItem: true
        }
      },
      evidence: {
        orderBy: { createdAt: "desc" }
      },
      incidents: {
        orderBy: { occurredAt: "desc" }
      },
      serviceOrder: {
        include: {
          center: true,
          facility: true,
          recipient: true,
          serviceType: {
            include: {
              checklistTemplates: {
                take: 1,
                orderBy: { version: "desc" },
                include: {
                  items: {
                    orderBy: { sortOrder: "asc" }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { scheduledStart: "asc" }
  }
} satisfies Prisma.CarerInclude;

type CarerWorkspaceRow = Prisma.CarerGetPayload<{
  include: typeof carerWorkspaceInclude;
}>;

function mapChecklistResult(
  value?: ChecklistResult
): CarerVisitChecklistItem["result"] {
  switch (value) {
    case ChecklistResult.PASS:
      return "pass";
    case ChecklistResult.FAIL:
      return "fail";
    case ChecklistResult.NOT_APPLICABLE:
      return "not_applicable";
    default:
      return "pending";
  }
}

function mapSeverity(value: IncidentSeverity) {
  return value.toLowerCase() as "low" | "medium" | "high" | "critical";
}

function mapCredentialStatus(value: CredentialStatus) {
  return value.toLowerCase() as CarerWorkspaceRecord["credentials"][number]["status"];
}

function mapStatus(value: PrismaVisitStatus) {
  return value.toLowerCase() as CarerWorkspaceRecord["visits"][number]["status"];
}

function getDaysToExpiry(value?: Date | null) {
  if (!value) {
    return undefined;
  }

  const dayMs = 1000 * 60 * 60 * 24;
  return Math.ceil((value.getTime() - Date.now()) / dayMs);
}

function getCredentialExpiryState(daysToExpiry?: number) {
  if (typeof daysToExpiry !== "number") {
    return "no_expiry" as const;
  }

  if (daysToExpiry < 0) {
    return "expired" as const;
  }

  if (daysToExpiry <= 45) {
    return "expiring_soon" as const;
  }

  return "current" as const;
}

function getCredentialExpirySummary(daysToExpiry?: number) {
  if (typeof daysToExpiry !== "number") {
    return "No expiry recorded.";
  }

  if (daysToExpiry < 0) {
    return `${Math.abs(daysToExpiry)} days overdue.`;
  }

  if (daysToExpiry === 0) {
    return "Expires today.";
  }

  return `${daysToExpiry} days remaining.`;
}

function getCredentialMatchingImpact(status: CredentialStatus, daysToExpiry?: number) {
  if (status === CredentialStatus.REJECTED) {
    return "Blocked until the credential is corrected and accepted.";
  }

  if (status === CredentialStatus.PENDING) {
    return "Not counted for provider matching until verification is complete.";
  }

  if (status === CredentialStatus.EXPIRED || (typeof daysToExpiry === "number" && daysToExpiry < 0)) {
    return "Blocked for matching until a current credential is recorded.";
  }

  if (typeof daysToExpiry === "number" && daysToExpiry <= 45) {
    return "Still matchable, but renewal is needed before continuity is affected.";
  }

  return "Counts as verified for provider matching.";
}

function getCredentialRenewalAction(status: CredentialStatus, daysToExpiry?: number) {
  if (status === CredentialStatus.REJECTED) {
    return "Upload corrected evidence and resubmit for provider review.";
  }

  if (status === CredentialStatus.PENDING) {
    return "Wait for provider review or follow up with the coordinator.";
  }

  if (status === CredentialStatus.EXPIRED || (typeof daysToExpiry === "number" && daysToExpiry < 0)) {
    return "Update the expiry date and attach renewed documentation.";
  }

  if (typeof daysToExpiry === "number" && daysToExpiry <= 45) {
    return "Start renewal now and update the credential before it expires.";
  }

  return "No action needed.";
}

function getChecklistItems(
  visit: CarerWorkspaceRow["visits"][number]
): CarerVisitChecklistItem[] {
  const template = visit.serviceOrder.serviceType.checklistTemplates[0];
  const existingItems = new Map(
    visit.checklistItems.map((item) => [item.templateItemId, item])
  );

  const templateItems = template?.items ?? [];

  if (templateItems.length === 0) {
    return [];
  }

  return templateItems.map((templateItem) => {
    const visitItem = existingItems.get(templateItem.id);

    return {
      id: visitItem?.id,
      templateItemId: templateItem.id,
      label: templateItem.label,
      result: mapChecklistResult(visitItem?.result),
      note: visitItem?.note ?? undefined
    };
  });
}

function getChecklistCompletion(items: ReturnType<typeof getChecklistItems>) {
  if (items.length === 0) {
    return 0;
  }

  const completedItems = items.filter((item) => item.result !== "pending").length;
  return Math.round((completedItems / items.length) * 100);
}

function getExecutionReadiness({
  checklistCompletion,
  evidenceCount,
  incidentCount
}: {
  checklistCompletion: number;
  evidenceCount: number;
  incidentCount: number;
}): CarerWorkspaceRecord["visits"][number]["executionReadiness"] {
  const reviewBlockers = [
    ...(checklistCompletion < 100 ? ["Complete every checklist item before review."] : []),
    ...(evidenceCount === 0 ? ["Capture at least one evidence item before review."] : [])
  ];

  return {
    checklistComplete: checklistCompletion === 100,
    evidenceCaptured: evidenceCount > 0,
    incidentCount,
    summary:
      reviewBlockers.length === 0
        ? incidentCount > 0
          ? "Ready for review with incident context attached."
          : "Ready for review with checklist and evidence attached."
        : "More execution context is needed before review.",
    reviewBlockers
  };
}

function getReadinessSummary(record: CarerWorkspaceRow): CarerWorkspaceRecord["readinessSummary"] {
  const positiveSignals: CarerReadinessSignal[] = [];
  const attentionSignals: CarerReadinessSignal[] = [];
  const blockerSignals: CarerReadinessSignal[] = [];
  const validCredentials = record.credentials.filter(
    (credential) =>
      credential.status === CredentialStatus.VALID &&
      (!credential.expiresAt || credential.expiresAt > new Date())
  );
  const workingBlocks = record.availabilityBlocks.filter((block) => block.isWorking);

  if (validCredentials.length > 0) {
    positiveSignals.push({
      id: "verified-skills",
      tone: "positive",
      label: `${validCredentials.length} verified skills`,
      detail: validCredentials.map((credential) => credential.name).join(", ")
    });
  } else {
    attentionSignals.push({
      id: "no-valid-credentials",
      tone: "warning",
      label: "No verified skills",
      detail: "Provider matching cannot confirm service skills until credentials are valid."
    });
  }

  if (workingBlocks.length > 0) {
    positiveSignals.push({
      id: "availability-declared",
      tone: "positive",
      label: `${workingBlocks.length} working blocks declared`,
      detail: "Provider matching can compare upcoming visits against declared availability."
    });
  } else {
    attentionSignals.push({
      id: "availability-missing",
      tone: "warning",
      label: "No working availability blocks",
      detail: "Provider matching is weaker until working blocks are declared."
    });
  }

  for (const credential of record.credentials) {
    const daysToExpiry = getDaysToExpiry(credential.expiresAt);
    const isExpiredByDate = typeof daysToExpiry === "number" && daysToExpiry < 0;

    if (credential.status === CredentialStatus.EXPIRED || isExpiredByDate) {
      blockerSignals.push({
        id: `credential-expired-${credential.id}`,
        tone: "critical",
        label: `${credential.name} expired`,
        detail: `${getCredentialExpirySummary(daysToExpiry)} This credential blocks matching for related service skills.`
      });
      continue;
    }

    if (credential.status === CredentialStatus.REJECTED) {
      blockerSignals.push({
        id: `credential-rejected-${credential.id}`,
        tone: "critical",
        label: `${credential.name} rejected`,
        detail: "This credential cannot be used for eligibility until it is corrected."
      });
      continue;
    }

    if (credential.status === CredentialStatus.PENDING) {
      attentionSignals.push({
        id: `credential-pending-${credential.id}`,
        tone: "warning",
        label: `${credential.name} pending`,
        detail: "This skill is not counted as verified until provider review is complete."
      });
    }

    if (typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 45) {
      attentionSignals.push({
        id: `credential-expiring-${credential.id}`,
        tone: "warning",
        label: `${credential.name} expires soon`,
        detail: `${getCredentialExpirySummary(daysToExpiry)} Renew before expiry to keep matching continuity.`
      });
    }
  }

  const status =
    blockerSignals.length > 0
      ? "restricted"
      : attentionSignals.length > 0
        ? "attention_needed"
        : "ready";

  return {
    status,
    headline:
      status === "ready"
        ? "Ready for matching"
        : status === "restricted"
          ? "Restricted from some assignments"
          : "Attention needed before matching is strong",
    operationalImpact:
      status === "ready"
        ? "This carer has verified skills and declared availability for provider matching."
        : status === "restricted"
          ? "Provider matching will exclude this carer where blockers affect required skills or service windows."
          : "This carer may still receive some work, but matching confidence is reduced until warnings are cleared.",
    positiveSignals,
    attentionSignals,
    blockerSignals
  };
}

function getWorkspaceAlerts(record: CarerWorkspaceRow): CarerWorkspaceRecord["alerts"] {
  const alerts: CarerWorkspaceRecord["alerts"] = [];
  const readinessSummary = getReadinessSummary(record);

  for (const signal of readinessSummary.blockerSignals) {
    alerts.push({
      id: signal.id,
      tone: "critical",
      title: signal.label,
      detail: signal.detail
    });
  }

  for (const signal of readinessSummary.attentionSignals) {
    alerts.push({
      id: signal.id,
      tone: "warning",
      title: signal.label,
      detail: signal.detail
    });
  }

  if (record.visits.some((visit) => visit.status === PrismaVisitStatus.CONFIRMED)) {
    alerts.push({
      id: "confirmed-visit-ready",
      tone: "neutral",
      title: "Confirmed visit ready to start",
      detail: "You already have at least one visit that can move into field execution."
    });
  }

  return alerts;
}

function mapWorkspace(record: CarerWorkspaceRow): CarerWorkspaceRecord {
  const readinessSummary = getReadinessSummary(record);
  const readinessStatus = readinessSummary.status;
  const alerts = getWorkspaceAlerts(record);
  const opportunityLimits = [
    ...readinessSummary.blockerSignals,
    ...readinessSummary.attentionSignals
  ].map((signal) => `${signal.label}: ${signal.detail}`);

  return {
    carerId: record.id,
    carerName: `${record.firstName} ${record.lastName}`,
    availability: record.availabilityNote ?? "Availability to be confirmed",
    readinessStatus,
    readinessSummary,
    verifiedSkills: record.credentials
      .filter(
        (credential) =>
          credential.status === CredentialStatus.VALID &&
          (!credential.expiresAt || credential.expiresAt > new Date())
      )
      .map((credential) => credential.name),
    opportunityLimits,
    alerts,
    credentials: record.credentials.map((credential) => {
      const daysToExpiry = getDaysToExpiry(credential.expiresAt);
      const expiryState = getCredentialExpiryState(daysToExpiry);

      return {
        id: credential.id,
        code: credential.code,
        name: credential.name,
        status: mapCredentialStatus(credential.status),
        issuedAt: credential.issuedAt?.toISOString(),
        expiresAt: credential.expiresAt?.toISOString(),
        documentUrl: credential.documentUrl ?? undefined,
        daysToExpiry,
        isExpiringSoon: expiryState === "expiring_soon",
        expiryState,
        expirySummary: getCredentialExpirySummary(daysToExpiry),
        matchingImpact: getCredentialMatchingImpact(credential.status, daysToExpiry),
        renewalAction: getCredentialRenewalAction(credential.status, daysToExpiry)
      };
    }),
    availabilityBlocks: record.availabilityBlocks
      .slice()
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
      .map((block) => ({
        id: block.id,
        startsAt: block.startsAt.toISOString(),
        endsAt: block.endsAt.toISOString(),
        isWorking: block.isWorking
      })),
    visits: record.visits.map((visit) => {
      const checklistItems = getChecklistItems(visit);
      const checklistCompletion = getChecklistCompletion(checklistItems);
      const evidence = visit.evidence.map((item) => ({
        id: item.id,
        kind: item.kind,
        fileUrl: item.fileUrl,
        capturedAt: item.capturedAt?.toISOString()
      }));
      const incidents = visit.incidents.map((incident) => ({
        id: incident.id,
        category: incident.category,
        severity: mapSeverity(incident.severity),
        summary: incident.summary,
        occurredAt: incident.occurredAt.toISOString()
      }));

      return {
        id: visit.id,
        label: new Intl.DateTimeFormat("en-AU", {
          weekday: "short",
          day: "2-digit",
          month: "short"
        }).format(visit.scheduledStart),
        orderCode: visit.serviceOrder.code,
        orderTitle: visit.serviceOrder.title,
        serviceType: visit.serviceOrder.serviceType.name,
        centerName: visit.serviceOrder.center.displayName,
        facilityName: visit.serviceOrder.facility.name,
        recipientName: `${visit.serviceOrder.recipient.firstName} ${visit.serviceOrder.recipient.lastName}`,
        scheduledStart: visit.scheduledStart.toISOString(),
        scheduledEnd: visit.scheduledEnd.toISOString(),
        actualStart: visit.actualStart?.toISOString(),
        actualEnd: visit.actualEnd?.toISOString(),
        status: mapStatus(visit.status),
        instructions:
          visit.serviceOrder.instructions ?? "No service instructions recorded yet.",
        notes: visit.exceptionReason ?? "No execution notes yet.",
        requiredSkills: visit.serviceOrder.requiredSkills,
        checklistCompletion,
        checklistItems,
        evidence,
        incidents,
        executionReadiness: getExecutionReadiness({
          checklistCompletion,
          evidenceCount: evidence.length,
          incidentCount: incidents.length
        })
      };
    })
  };
}

export async function getCarerWorkspace(userId: string) {
  noStore();

  const carer = await prisma.carer.findFirst({
    where: {
      ownerUserId: userId,
      isActive: true
    },
    include: carerWorkspaceInclude
  });

  return carer ? mapWorkspace(carer) : null;
}
