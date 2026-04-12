import {
  ClosingPeriodStatus as PrismaClosingPeriodStatus,
  CredentialStatus,
  ExpenseType as PrismaExpenseType,
  Prisma,
  ReviewOutcome as PrismaReviewOutcome,
  ServiceOrderStatus,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SKILL_CATALOG } from "@/lib/catalogs";
import {
  ClosingWorkspaceRecord,
  IncidentSeverity,
  ProviderMetric,
  ReviewOutcome,
  ServiceOrderRecord
} from "@/lib/providers";

export type ProviderOrderFormData = {
  centers: Array<{
    id: string;
    name: string;
    facilities: Array<{
      id: string;
      name: string;
      recipients: Array<{
        id: string;
        name: string;
      }>;
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

const closingPeriodInclude = {
  settlements: {
    include: {
      visit: {
        include: {
          assignedCarer: true,
          expenses: {
            orderBy: { createdAt: "desc" }
          },
          serviceOrder: {
            include: {
              recipient: true,
              serviceType: true
            }
          }
        }
      }
    },
    orderBy: {
      visit: {
        scheduledStart: "asc"
      }
    }
  }
} satisfies Prisma.ClosingPeriodInclude;

type ClosingPeriodRow = Prisma.ClosingPeriodGetPayload<{
  include: typeof closingPeriodInclude;
}>;

const providerOrderInclude = {
  center: true,
  facility: true,
  recipient: true,
  serviceType: true,
  provider: {
    include: {
      carers: {
        where: { isActive: true },
        include: {
          credentials: {
            where: { status: CredentialStatus.VALID }
          }
        },
        orderBy: [{ rating: "desc" }, { lastName: "asc" }]
      }
    }
  },
  visits: {
    include: {
      assignedCarer: true,
      checklistItems: true,
      evidence: true,
      incidents: true,
      reviews: {
        include: { reviewer: true },
        orderBy: { reviewedAt: "desc" }
      }
    },
    orderBy: { scheduledStart: "asc" }
  }
} satisfies Prisma.ServiceOrderInclude;

type ProviderOrderRow = Prisma.ServiceOrderGetPayload<{
  include: typeof providerOrderInclude;
}>;

function toLowerSnake<T extends string>(value: T) {
  return value.toLowerCase() as Lowercase<T>;
}

function mapExpenseType(value: PrismaExpenseType) {
  return value.toLowerCase() as ClosingWorkspaceRecord["periods"][number]["visits"][number]["expenses"][number]["type"];
}

function mapClosingStatus(value: PrismaClosingPeriodStatus) {
  return value.toLowerCase() as ClosingWorkspaceRecord["periods"][number]["status"];
}

function durationInMinutes(start?: Date | null, end?: Date | null) {
  if (!start || !end) {
    return 0;
  }

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function isVisitInsidePeriod(
  visit: { actualEnd?: Date | null; scheduledEnd: Date },
  period: { startsAt: Date; endsAt: Date }
) {
  const comparisonDate = visit.actualEnd ?? visit.scheduledEnd;
  return comparisonDate >= period.startsAt && comparisonDate <= period.endsAt;
}

function deriveCoverageRisk(order: ProviderOrderRow): ServiceOrderRecord["coverageRisk"] {
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

function mapOrder(order: ProviderOrderRow): ServiceOrderRecord {
  const requiredSkills = order.requiredSkills;
  const requiredLanguage = order.requiredLanguage?.toLowerCase();
  const eligibleCarers = order.provider.carers
    .filter((carer) => {
      const credentialNames = carer.credentials.map((credential) => credential.name.toLowerCase());
      const matchesSkills = requiredSkills.every((skill) =>
        credentialNames.includes(skill.toLowerCase())
      );
      const matchesLanguage =
        !requiredLanguage ||
        !carer.primaryLanguage ||
        carer.primaryLanguage.toLowerCase() === requiredLanguage;

      return matchesSkills && matchesLanguage;
    })
    .map((carer) => ({
      id: carer.id,
      name: `${carer.firstName} ${carer.lastName}`,
      credentials: carer.credentials.map((credential) => credential.name),
      availability: carer.availabilityNote ?? "Availability to be confirmed",
      rating: carer.rating
    }));

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
    coverageRisk: deriveCoverageRisk(order),
    instructions: order.instructions ?? "No operating instructions yet.",
    notesForCoordinator: order.coordinatorNotes ?? "No coordinator notes yet.",
    eligibleCarers,
    visits: order.visits.map((visit) => ({
      id: visit.id,
      label: new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      }).format(visit.scheduledStart),
      scheduledStart: visit.scheduledStart.toISOString(),
      scheduledEnd: visit.scheduledEnd.toISOString(),
      status: toLowerSnake(visit.status) as ServiceOrderRecord["visits"][number]["status"],
      assignedCarerId: visit.assignedCarerId ?? undefined,
      assignedCarerName: visit.assignedCarer
        ? `${visit.assignedCarer.firstName} ${visit.assignedCarer.lastName}`
        : undefined,
      checklistCompletion: visit.checklistItems.length > 0 ? 100 : 0,
      evidenceCount: visit.evidence.length,
      notes: visit.exceptionReason ?? "Visit on track.",
      incident: visit.incidents[0]
        ? {
            id: visit.incidents[0].id,
            category: visit.incidents[0].category,
            severity: toLowerSnake(visit.incidents[0].severity) as IncidentSeverity,
            summary: visit.incidents[0].summary
          }
        : undefined,
      review: visit.reviews[0]
        ? {
            reviewer: visit.reviews[0].reviewer.fullName,
            outcome: toLowerSnake(visit.reviews[0].outcome) as ReviewOutcome,
            at: visit.reviews[0].reviewedAt.toISOString(),
            note: visit.reviews[0].notes ?? "No review notes"
          }
        : undefined
    }))
  };
}

export async function listProviderOrders(providerId: string): Promise<ServiceOrderRecord[]> {
  noStore();
  const orders = await prisma.serviceOrder.findMany({
    where: { providerId },
    include: providerOrderInclude,
    orderBy: [{ priority: "desc" }, { startsOn: "asc" }]
  });

  return orders.map(mapOrder);
}

export async function getProviderOrder(
  orderId: string,
  providerId: string
): Promise<ServiceOrderRecord | null> {
  noStore();
  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, providerId },
    include: providerOrderInclude
  });

  return order ? mapOrder(order) : null;
}

export async function getProviderMetrics(providerId: string): Promise<ProviderMetric[]> {
  const orders = await listProviderOrders(providerId);
  const visits = orders.flatMap((order) => order.visits);
  const approved = visits.filter((visit) => visit.status === "approved").length;
  const underReview = visits.filter((visit) => visit.status === "under_review").length;
  const unassigned = visits.filter((visit) => !visit.assignedCarerId).length;
  const criticalOrders = orders.filter((order) => order.coverageRisk === "critical").length;

  return [
    {
      label: "Orders in flight",
      value: String(orders.filter((order) => order.status !== "closed").length),
      tone: "neutral",
      detail: "Demand currently managed by coordination"
    },
    {
      label: "Visits pending review",
      value: String(underReview),
      tone: "warning",
      detail: "Need approval before closure"
    },
    {
      label: "Unassigned visits",
      value: String(unassigned),
      tone: unassigned > 0 ? "critical" : "neutral",
      detail: "Open risk in the next operational window"
    },
    {
      label: "Approved visits",
      value: String(approved),
      tone: "positive",
      detail: "Already ready for closing period"
    },
    {
      label: "Critical coverage",
      value: String(criticalOrders),
      tone: criticalOrders > 0 ? "critical" : "positive",
      detail: "Orders needing escalation now"
    }
  ];
}

function mapClosingPeriod(
  period: ClosingPeriodRow,
  approvedVisits: Array<{
    id: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    actualStart: Date | null;
    actualEnd: Date | null;
    status: PrismaVisitStatus;
    assignedCarer: { firstName: string; lastName: string } | null;
    expenses: Array<{
      id: string;
      type: PrismaExpenseType;
      amountCents: number;
      currency: string;
      note: string | null;
      evidenceUrl: string | null;
      createdAt: Date;
    }>;
    serviceOrder: {
      code: string;
      title: string;
      recipient: { firstName: string; lastName: string };
      serviceType: { name: string };
    };
  }>
): ClosingWorkspaceRecord["periods"][number] {
  const settlementByVisitId = new Map(period.settlements.map((settlement) => [settlement.visitId, settlement]));
  const visits = approvedVisits
    .filter((visit) => isVisitInsidePeriod(visit, period))
    .map((visit) => {
      const settlement = settlementByVisitId.get(visit.id);
      const suggestedApprovedMinutes =
        durationInMinutes(visit.actualStart, visit.actualEnd) ||
        durationInMinutes(visit.scheduledStart, visit.scheduledEnd);

      return {
        id: visit.id,
        orderCode: visit.serviceOrder.code,
        orderTitle: visit.serviceOrder.title,
        recipientName: `${visit.serviceOrder.recipient.firstName} ${visit.serviceOrder.recipient.lastName}`,
        serviceType: visit.serviceOrder.serviceType.name,
        carerName: visit.assignedCarer
          ? `${visit.assignedCarer.firstName} ${visit.assignedCarer.lastName}`
          : undefined,
        status: toLowerSnake(visit.status) as ClosingWorkspaceRecord["periods"][number]["visits"][number]["status"],
        scheduledStart: visit.scheduledStart.toISOString(),
        scheduledEnd: visit.scheduledEnd.toISOString(),
        actualStart: visit.actualStart?.toISOString(),
        actualEnd: visit.actualEnd?.toISOString(),
        suggestedApprovedMinutes,
        settlementId: settlement?.id,
        approvedMinutes: settlement?.approvedMinutes ?? undefined,
        billableCents: settlement?.billableCents ?? undefined,
        payableCents: settlement?.payableCents ?? undefined,
        isReadyForExport: Boolean(
          settlement &&
            typeof settlement.approvedMinutes === "number" &&
            period.status !== PrismaClosingPeriodStatus.OPEN
        ),
        expenses: visit.expenses.map((expense) => ({
          id: expense.id,
          type: mapExpenseType(expense.type),
          amountCents: expense.amountCents,
          currency: expense.currency,
          note: expense.note ?? undefined,
          evidenceUrl: expense.evidenceUrl ?? undefined,
          createdAt: expense.createdAt.toISOString()
        }))
      };
    });

  const settledVisitsCount = visits.filter((visit) => Boolean(visit.settlementId)).length;
  const unsettledVisitsCount = visits.length - settledVisitsCount;
  const approvedMinutesTotal = visits.reduce(
    (total, visit) => total + (visit.approvedMinutes ?? visit.suggestedApprovedMinutes),
    0
  );
  const billableCentsTotal = visits.reduce((total, visit) => total + (visit.billableCents ?? 0), 0);
  const payableCentsTotal = visits.reduce((total, visit) => total + (visit.payableCents ?? 0), 0);
  const expenseCentsTotal = visits.reduce(
    (total, visit) =>
      total + visit.expenses.reduce((expenseTotal, expense) => expenseTotal + expense.amountCents, 0),
    0
  );

  return {
    id: period.id,
    label: period.label,
    startsAt: period.startsAt.toISOString(),
    endsAt: period.endsAt.toISOString(),
    status: mapClosingStatus(period.status),
    readyForExport: period.status === PrismaClosingPeriodStatus.LOCKED,
    approvedVisitsCount: visits.length,
    settledVisitsCount,
    unsettledVisitsCount,
    approvedMinutesTotal,
    billableCentsTotal,
    payableCentsTotal,
    expenseCentsTotal,
    visits
  };
}

export async function getProviderClosingWorkspace(
  providerId: string
): Promise<ClosingWorkspaceRecord> {
  noStore();

  const [periods, approvedVisits] = await Promise.all([
    prisma.closingPeriod.findMany({
      where: { providerId },
      include: closingPeriodInclude,
      orderBy: [{ startsAt: "desc" }]
    }),
    prisma.visit.findMany({
      where: {
        serviceOrder: { providerId },
        status: PrismaVisitStatus.APPROVED
      },
      include: {
        assignedCarer: true,
        expenses: {
          orderBy: { createdAt: "desc" }
        },
        serviceOrder: {
          include: {
            recipient: true,
            serviceType: true
          }
        }
      },
      orderBy: { scheduledStart: "desc" }
    })
  ]);

  const mappedPeriods = periods.map((period) => mapClosingPeriod(period, approvedVisits));

  return {
    periods: mappedPeriods,
    summary: {
      periodsOpen: mappedPeriods.filter((period) => period.status === "open").length,
      visitsReadyForSettlement: mappedPeriods.reduce(
        (total, period) => total + period.unsettledVisitsCount,
        0
      ),
      visitsReadyForExport: mappedPeriods.reduce(
        (total, period) => total + period.visits.filter((visit) => visit.isReadyForExport).length,
        0
      ),
      approvedMinutesInFlight: mappedPeriods.reduce(
        (total, period) => total + period.approvedMinutesTotal,
        0
      )
    }
  };
}

export async function getProviderOrderFormData(): Promise<ProviderOrderFormData> {
  noStore();

  const [centers, serviceTypes] = await Promise.all([
    prisma.organization.findMany({
      where: { kind: "CENTER" },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        facilities: {
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
    centers: centers.map((center) => ({
      id: center.id,
      name: center.displayName,
      facilities: center.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        recipients: facility.recipients.map((recipient) => ({
          id: recipient.id,
          name: `${recipient.firstName} ${recipient.lastName}`
        }))
      }))
    })),
    serviceTypes,
    skills: [...SKILL_CATALOG]
  };
}

const reviewOutcomeMap = {
  approved: PrismaReviewOutcome.APPROVED,
  needs_changes: PrismaReviewOutcome.NEEDS_CHANGES,
  rejected: PrismaReviewOutcome.REJECTED
} as const;

const visitStatusMap = {
  scheduled: PrismaVisitStatus.SCHEDULED,
  confirmed: PrismaVisitStatus.CONFIRMED,
  in_progress: PrismaVisitStatus.IN_PROGRESS,
  completed: PrismaVisitStatus.COMPLETED,
  under_review: PrismaVisitStatus.UNDER_REVIEW,
  approved: PrismaVisitStatus.APPROVED,
  rejected: PrismaVisitStatus.REJECTED,
  cancelled: PrismaVisitStatus.CANCELLED,
  no_show: PrismaVisitStatus.NO_SHOW
} as const;

export function toPrismaReviewOutcome(outcome: keyof typeof reviewOutcomeMap) {
  return reviewOutcomeMap[outcome];
}

export function toPrismaVisitStatus(status: keyof typeof visitStatusMap) {
  return visitStatusMap[status];
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

