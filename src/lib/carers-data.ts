import {
  ChecklistResult,
  CredentialStatus,
  IncidentSeverity,
  Prisma,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { CarerVisitChecklistItem, CarerWorkspaceRecord } from "@/lib/carers";
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

function getReadinessStatus(record: CarerWorkspaceRow): CarerWorkspaceRecord["readinessStatus"] {
  const hasExpiredCredential = record.credentials.some(
    (credential) => credential.status === CredentialStatus.EXPIRED
  );
  const hasExpiringCredential = record.credentials.some((credential) => {
    const daysToExpiry = getDaysToExpiry(credential.expiresAt);
    return typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 45;
  });

  if (hasExpiredCredential) {
    return "restricted";
  }

  if (hasExpiringCredential || record.availabilityBlocks.length === 0) {
    return "attention_needed";
  }

  return "ready";
}

function getWorkspaceAlerts(record: CarerWorkspaceRow): CarerWorkspaceRecord["alerts"] {
  const alerts: CarerWorkspaceRecord["alerts"] = [];

  for (const credential of record.credentials) {
    const daysToExpiry = getDaysToExpiry(credential.expiresAt);

    if (credential.status === CredentialStatus.EXPIRED) {
      alerts.push({
        id: `credential-expired-${credential.id}`,
        tone: "critical",
        title: `${credential.name} expired`,
        detail: "This credential is currently blocking some assignments."
      });
      continue;
    }

    if (typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 45) {
      alerts.push({
        id: `credential-expiring-${credential.id}`,
        tone: "warning",
        title: `${credential.name} expires soon`,
        detail: `${daysToExpiry} days remaining before operational eligibility is affected.`
      });
    }
  }

  if (record.availabilityBlocks.length === 0) {
    alerts.push({
      id: "availability-missing",
      tone: "warning",
      title: "No availability blocks recorded",
      detail: "Provider matching is weaker until working blocks are declared."
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
  const readinessStatus = getReadinessStatus(record);
  const alerts = getWorkspaceAlerts(record);
  const opportunityLimits = alerts
    .filter((alert) => alert.tone !== "neutral")
    .map((alert) => alert.title);

  return {
    carerId: record.id,
    carerName: `${record.firstName} ${record.lastName}`,
    availability: record.availabilityNote ?? "Availability to be confirmed",
    readinessStatus,
    verifiedSkills: record.credentials
      .filter((credential) => credential.status === CredentialStatus.VALID)
      .map((credential) => credential.name),
    opportunityLimits,
    alerts,
    credentials: record.credentials.map((credential) => {
      const daysToExpiry = getDaysToExpiry(credential.expiresAt);

      return {
        id: credential.id,
        code: credential.code,
        name: credential.name,
        status: mapCredentialStatus(credential.status),
        issuedAt: credential.issuedAt?.toISOString(),
        expiresAt: credential.expiresAt?.toISOString(),
        documentUrl: credential.documentUrl ?? undefined,
        daysToExpiry,
        isExpiringSoon: typeof daysToExpiry === "number" && daysToExpiry >= 0 && daysToExpiry <= 45
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
        checklistCompletion: getChecklistCompletion(checklistItems),
        checklistItems,
        evidence: visit.evidence.map((item) => ({
          id: item.id,
          kind: item.kind,
          fileUrl: item.fileUrl,
          capturedAt: item.capturedAt?.toISOString()
        })),
        incidents: visit.incidents.map((incident) => ({
          id: incident.id,
          category: incident.category,
          severity: mapSeverity(incident.severity),
          summary: incident.summary,
          occurredAt: incident.occurredAt.toISOString()
        }))
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
