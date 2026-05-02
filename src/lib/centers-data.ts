import {
  Prisma,
  ChecklistResult,
  ServiceOrderStatus,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SKILL_CATALOG } from "@/lib/catalogs";
import {
  IncidentSeverity,
  ProviderMetric,
  ReviewOutcome,
  ServiceOrderRecord,
  VisitChecklistItem
} from "@/lib/providers";

export type CenterOrderFormData = {
  centerId: string;
  providers: Array<{
    id: string;
    name: string;
  }>;
  facilities: Array<{
    id: string;
    name: string;
    recipients: Array<{
      id: string;
      name: string;
    }>;
  }>;
  serviceTypes: Array<{
    id: string;
    code: string;
    name: string;
    defaultDurationMin: number;
  }>;
  skills: string[];
};

export type CenterPortalData = {
  id: string;
  name: string;
  legalName: string;
  managerName: string;
  managerEmail: string;
  providerName: string;
  sites: Array<{
    id: string;
    name: string;
    suburb: string;
    state: string;
    address: string;
    recipientsCount: number;
    activeOrdersCount: number;
  }>;
  recipients: Array<{
    id: string;
    name: string;
    siteName: string;
    notes: string;
    activeOrdersCount: number;
  }>;
};

const centerOrderInclude = {
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
  },
  provider: true,
  visits: {
    include: {
      assignedCarer: true,
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
      reviews: {
        include: { reviewer: true },
        orderBy: { reviewedAt: "desc" }
      }
    },
    orderBy: { scheduledStart: "asc" }
  }
} satisfies Prisma.ServiceOrderInclude;

type CenterOrderRow = Prisma.ServiceOrderGetPayload<{
  include: typeof centerOrderInclude;
}>;

function toLowerSnake<T extends string>(value: T) {
  return value.toLowerCase() as Lowercase<T>;
}

function mapChecklistResult(value?: ChecklistResult): VisitChecklistItem["result"] {
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

function getVisitChecklistItems(
  visit: CenterOrderRow["visits"][number],
  order: CenterOrderRow
): VisitChecklistItem[] {
  const templateItems = order.serviceType.checklistTemplates[0]?.items ?? [];
  const existingItems = new Map(
    visit.checklistItems.map((item) => [item.templateItemId, item])
  );

  if (templateItems.length === 0) {
    return visit.checklistItems.map((item) => ({
      id: item.id,
      label: item.templateItem.label,
      result: mapChecklistResult(item.result),
      note: item.note ?? undefined
    }));
  }

  return templateItems.map((templateItem) => {
    const item = existingItems.get(templateItem.id);

    return {
      id: item?.id,
      label: templateItem.label,
      result: mapChecklistResult(item?.result),
      note: item?.note ?? undefined
    };
  });
}

function getChecklistCompletion(items: VisitChecklistItem[]) {
  if (items.length === 0) {
    return 0;
  }

  const completedItems = items.filter((item) => item.result !== "pending").length;
  return Math.round((completedItems / items.length) * 100);
}

function deriveCoverageRisk(order: CenterOrderRow): ServiceOrderRecord["coverageRisk"] {
  const hasUnassignedVisit = order.visits.some((visit) => !visit.assignedCarerId);
  const hasReviewBlocker = order.visits.some(
    (visit) =>
      visit.status === PrismaVisitStatus.UNDER_REVIEW ||
      visit.status === PrismaVisitStatus.REJECTED
  );

  if (order.priority === "CRITICAL" || hasUnassignedVisit) {
    return order.priority === "CRITICAL" ? "critical" : "warning";
  }

  if (hasReviewBlocker) {
    return "warning";
  }

  return "stable";
}

function deriveVisitCoverageStatus(
  visit: CenterOrderRow["visits"][number]
): ServiceOrderRecord["visits"][number]["coverageStatus"] {
  if (
    visit.status === PrismaVisitStatus.NO_SHOW ||
    (visit.status === PrismaVisitStatus.CANCELLED && Boolean(visit.assignedCarerId))
  ) {
    return "needs_replacement";
  }

  if (!visit.assignedCarerId) {
    return "uncovered";
  }

  if (
    visit.status === PrismaVisitStatus.UNDER_REVIEW ||
    visit.status === PrismaVisitStatus.REJECTED ||
    visit.status === PrismaVisitStatus.COMPLETED
  ) {
    return "at_risk";
  }

  return "covered";
}

function deriveOrderCoverageStatus(order: CenterOrderRow): ServiceOrderRecord["coverageStatus"] {
  const statuses = order.visits.map(deriveVisitCoverageStatus);

  if (statuses.includes("needs_replacement")) {
    return "needs_replacement";
  }

  if (statuses.includes("uncovered")) {
    return "uncovered";
  }

  if (statuses.includes("at_risk")) {
    return "at_risk";
  }

  return "covered";
}

function mapOrder(order: CenterOrderRow): ServiceOrderRecord {
  const coverageStatus = deriveOrderCoverageStatus(order);
  const visits = order.visits.map((visit) => {
    const checklistItems = getVisitChecklistItems(visit, order);
    const incidents = visit.incidents.map((incident) => ({
      id: incident.id,
      category: incident.category,
      severity: toLowerSnake(incident.severity) as IncidentSeverity,
      summary: incident.summary,
      occurredAt: incident.occurredAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString()
    }));

    return {
      id: visit.id,
      label: new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      }).format(visit.scheduledStart),
      scheduledStart: visit.scheduledStart.toISOString(),
      scheduledEnd: visit.scheduledEnd.toISOString(),
      status: toLowerSnake(visit.status) as ServiceOrderRecord["visits"][number]["status"],
      coverageStatus: deriveVisitCoverageStatus(visit),
      assignedCarerId: visit.assignedCarerId ?? undefined,
      assignedCarerName: visit.assignedCarer
        ? `${visit.assignedCarer.firstName} ${visit.assignedCarer.lastName}`
        : undefined,
      checklistCompletion: getChecklistCompletion(checklistItems),
      checklistItems,
      evidenceCount: visit.evidence.length,
      evidence: visit.evidence.map((item) => ({
        id: item.id,
        kind: item.kind,
        fileUrl: item.fileUrl,
        capturedAt: item.capturedAt?.toISOString()
      })),
      notes: visit.exceptionReason ?? "Visit on track.",
      incidents,
      incident: incidents[0],
      review: visit.reviews[0]
        ? {
            reviewer: visit.reviews[0].reviewer.fullName,
            outcome: toLowerSnake(visit.reviews[0].outcome) as ReviewOutcome,
            at: visit.reviews[0].reviewedAt.toISOString(),
            note: visit.reviews[0].notes ?? "No review notes"
          }
        : undefined
    };
  });

  return {
    id: order.id,
    code: order.code,
    title: order.title,
    centerName: order.center.displayName,
    facilityName: order.facility.name,
    recipientName: `${order.recipient.firstName} ${order.recipient.lastName}`,
    serviceType: order.serviceType.name,
    status: toLowerSnake(order.status) as ServiceOrderRecord["status"],
    priority: toLowerSnake(order.priority) as ServiceOrderRecord["priority"],
    requiredSkills: order.requiredSkills,
    requiredLanguage: order.requiredLanguage ?? undefined,
    frequency: order.recurrenceRule ?? "One-off order",
    plannedDurationMin: order.plannedDurationMin,
    startsOn: order.startsOn.toISOString(),
    endsOn: order.endsOn?.toISOString(),
    coverageRisk: deriveCoverageRisk(order),
    coverageStatus,
    pendingAction:
      coverageStatus === "needs_replacement"
        ? "Provider needs to replace broken coverage."
        : coverageStatus === "uncovered"
          ? "Provider still needs to assign coverage."
          : coverageStatus === "at_risk"
            ? "Provider still needs to clear review or exception handling."
            : "Order is operationally covered.",
    instructions: order.instructions ?? "No operating instructions yet.",
    notesForCoordinator: order.coordinatorNotes ?? "No provider handoff note yet.",
    eligibleCarers: [],
    visits
  };
}

export async function listCenterOrders(centerId: string): Promise<ServiceOrderRecord[]> {
  noStore();
  const orders = await prisma.serviceOrder.findMany({
    where: { centerId },
    include: centerOrderInclude,
    orderBy: [{ priority: "desc" }, { startsOn: "asc" }]
  });

  return orders.map(mapOrder);
}

export async function getCenterPortalData(
  centerId: string,
  managerUserId: string
): Promise<CenterPortalData> {
  noStore();

  const [center, manager, providerClient, activeOrders] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: centerId },
      select: {
        id: true,
        displayName: true,
        legalName: true,
        facilities: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            addressLine1: true,
            suburb: true,
            state: true,
            recipients: {
              orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
              select: {
                id: true,
                firstName: true,
                lastName: true,
                notes: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: managerUserId },
      select: {
        fullName: true,
        email: true
      }
    }),
    prisma.providerClient.findFirst({
      where: { centerId },
      include: {
        provider: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.serviceOrder.findMany({
      where: {
        centerId,
        status: {
          notIn: [ServiceOrderStatus.CANCELLED, ServiceOrderStatus.CLOSED]
        }
      },
      select: {
        facilityId: true,
        recipientId: true
      }
    })
  ]);

  const activeOrdersBySite = new Map<string, number>();
  const activeOrdersByRecipient = new Map<string, number>();

  for (const order of activeOrders) {
    activeOrdersBySite.set(order.facilityId, (activeOrdersBySite.get(order.facilityId) ?? 0) + 1);
    activeOrdersByRecipient.set(
      order.recipientId,
      (activeOrdersByRecipient.get(order.recipientId) ?? 0) + 1
    );
  }

  return {
    id: center.id,
    name: center.displayName,
    legalName: center.legalName,
    managerName: manager.fullName,
    managerEmail: manager.email,
    providerName: providerClient?.provider.displayName ?? "No provider linked",
    sites: center.facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      suburb: facility.suburb,
      state: facility.state,
      address: facility.addressLine1,
      recipientsCount: facility.recipients.length,
      activeOrdersCount: activeOrdersBySite.get(facility.id) ?? 0
    })),
    recipients: center.facilities.flatMap((facility) =>
      facility.recipients.map((recipient) => ({
        id: recipient.id,
        name: `${recipient.firstName} ${recipient.lastName}`.trim(),
        siteName: facility.name,
        notes: recipient.notes ?? "No center notes recorded.",
        activeOrdersCount: activeOrdersByRecipient.get(recipient.id) ?? 0
      }))
    )
  };
}

export async function getCenterOrder(
  orderId: string,
  centerId: string
): Promise<(ServiceOrderRecord & { providerName: string }) | null> {
  noStore();
  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, centerId },
    include: centerOrderInclude
  });

  if (!order) {
    return null;
  }

  return {
    ...mapOrder(order),
    providerName: order.provider.displayName
  };
}

export async function getCenterMetrics(centerId: string): Promise<ProviderMetric[]> {
  const orders = await listCenterOrders(centerId);
  const visits = orders.flatMap((order) => order.visits);
  const activeOrders = orders.filter((order) => order.status !== "closed").length;
  const uncoveredVisits = visits.filter((visit) => !visit.assignedCarerId).length;
  const incidents = visits.filter((visit) => Boolean(visit.incident)).length;
  const approved = visits.filter((visit) => visit.status === "approved").length;

  return [
    {
      label: "Demand in flight",
      value: String(activeOrders),
      tone: "neutral",
      detail: "Orders submitted by this center and still active"
    },
    {
      label: "Visits without cover",
      value: String(uncoveredVisits),
      tone: uncoveredVisits > 0 ? "critical" : "positive",
      detail: "Coverage gaps still waiting on provider action"
    },
    {
      label: "Visits with incidents",
      value: String(incidents),
      tone: incidents > 0 ? "warning" : "positive",
      detail: "Exceptions the center may need to review"
    },
    {
      label: "Approved visits",
      value: String(approved),
      tone: "positive",
      detail: "Completed and validated against evidence"
    }
  ];
}

export async function getCenterOrderFormData(centerId: string): Promise<CenterOrderFormData> {
  noStore();

  const [providerClients, facilities, serviceTypes] = await Promise.all([
    prisma.providerClient.findMany({
      where: {
        centerId,
        status: "active"
      },
      orderBy: { createdAt: "asc" },
      select: {
        provider: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    }),
    prisma.facility.findMany({
      where: { organizationId: centerId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        recipients: {
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.serviceType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        defaultDurationMin: true
      }
    })
  ]);

  return {
    centerId,
    providers: providerClients.map((providerClient) => ({
      id: providerClient.provider.id,
      name: providerClient.provider.displayName
    })),
    facilities: facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      recipients: facility.recipients.map((recipient) => ({
        id: recipient.id,
        name: `${recipient.firstName} ${recipient.lastName}`
      }))
    })),
    serviceTypes,
    skills: [...SKILL_CATALOG]
  };
}

export async function createCenterOrderCode() {
  const count = await prisma.serviceOrder.count();
  return `SR-${2400 + count + 1}`;
}

export async function syncServiceOrderStatus(serviceOrderId: string) {
  const visits = await prisma.visit.findMany({
    where: { serviceOrderId },
    select: { status: true, assignedCarerId: true }
  });

  let nextStatus: ServiceOrderStatus = ServiceOrderStatus.OPEN;
  const activeStatuses: PrismaVisitStatus[] = [
    PrismaVisitStatus.IN_PROGRESS,
    PrismaVisitStatus.COMPLETED,
    PrismaVisitStatus.UNDER_REVIEW,
    PrismaVisitStatus.APPROVED,
    PrismaVisitStatus.REJECTED,
    PrismaVisitStatus.NO_SHOW
  ];

  if (visits.length === 0) {
    nextStatus = ServiceOrderStatus.DRAFT;
  } else if (visits.every((visit) => visit.status === PrismaVisitStatus.APPROVED)) {
    nextStatus = ServiceOrderStatus.COMPLETED;
  } else if (visits.some((visit) => activeStatuses.includes(visit.status))) {
    nextStatus = ServiceOrderStatus.ACTIVE;
  } else {
    const assignedVisits = visits.filter((visit) => Boolean(visit.assignedCarerId)).length;

    if (assignedVisits === 0) {
      nextStatus = ServiceOrderStatus.OPEN;
    } else if (assignedVisits < visits.length) {
      nextStatus = ServiceOrderStatus.PARTIALLY_ASSIGNED;
    } else {
      nextStatus = ServiceOrderStatus.ASSIGNED;
    }
  }

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { status: nextStatus }
  });
}


