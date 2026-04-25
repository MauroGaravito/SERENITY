import {
  ClosingPeriodStatus as PrismaClosingPeriodStatus,
  CredentialStatus,
  ExpenseType as PrismaExpenseType,
  ExternalSyncStatus as PrismaExternalSyncStatus,
  ExportJobAttemptKind as PrismaExportJobAttemptKind,
  ExportJobAttemptResult as PrismaExportJobAttemptResult,
  ExportJobStatus as PrismaExportJobStatus,
  Prisma,
  ReviewOutcome as PrismaReviewOutcome,
  ServiceOrderStatus,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { checkConnectorStatus, executeConnector } from "@/lib/export-connectors";
import { prisma } from "@/lib/prisma";
import { SKILL_CATALOG } from "@/lib/catalogs";
import {
  ClosingExportPackage,
  ClosingWorkspaceRecord,
  ExportTargetSystem,
  ExportJobLifecycleStatus,
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
  exportJobs: {
    include: {
      attempts: {
        orderBy: [{ createdAt: "desc" }]
      }
    },
    orderBy: [{ createdAt: "desc" }]
  },
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

const closingExportInclude = {
  provider: true,
  exportJobs: {
    include: {
      attempts: {
        orderBy: [{ createdAt: "desc" }]
      }
    },
    orderBy: [{ createdAt: "desc" }]
  },
  settlements: {
    include: {
      visit: {
        include: {
          assignedCarer: true,
          expenses: {
            orderBy: { createdAt: "asc" }
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
            orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { name: "asc" }]
          },
          availabilityBlocks: {
            where: {
              endsAt: {
                gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
              }
            },
            orderBy: [{ startsAt: "asc" }]
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

function deriveExportJobStatus(
  value: PrismaExportJobStatus,
  externalStatus: PrismaExternalSyncStatus
): ExportJobLifecycleStatus {
  if (value === PrismaExportJobStatus.PENDING) {
    return "queued";
  }

  if (value === PrismaExportJobStatus.PROCESSING) {
    return "processing";
  }

  if (value === PrismaExportJobStatus.FAILED || externalStatus === PrismaExternalSyncStatus.REJECTED) {
    return "failed";
  }

  if (externalStatus === PrismaExternalSyncStatus.ACKNOWLEDGED) {
    return "acknowledged";
  }

  return "sent";
}

function mapExportJobAttemptKind(value: PrismaExportJobAttemptKind) {
  return value.toLowerCase() as ClosingWorkspaceRecord["periods"][number]["exportJobs"][number]["attempts"][number]["kind"];
}

function mapExportJobAttemptResult(value: PrismaExportJobAttemptResult): ExportJobLifecycleStatus {
  if (value === PrismaExportJobAttemptResult.ACKNOWLEDGED) {
    return "acknowledged";
  }

  if (value === PrismaExportJobAttemptResult.FAILED) {
    return "failed";
  }

  return "sent";
}

function mapExportTarget(value: string) {
  return value as ExportTargetSystem;
}

function getExportBatchId(periodId: string) {
  return `serenity-${periodId}`;
}

function getNextSyncCheckTime(from = new Date()) {
  return new Date(from.getTime() + 5 * 60 * 1000);
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
  const coverageStatus = deriveOrderCoverageStatus(order);

  if (
    order.priority === "CRITICAL" ||
    coverageStatus === "needs_replacement" ||
    coverageStatus === "uncovered"
  ) {
    return "critical";
  }

  if (
    coverageStatus === "at_risk" ||
    order.visits.some(
      (visit) =>
        visit.status === PrismaVisitStatus.UNDER_REVIEW ||
        visit.status === PrismaVisitStatus.REJECTED
    )
  ) {
    return "warning";
  }

  return "stable";
}

function hasAvailabilityCoverage(
  blocks: Array<{ startsAt: Date; endsAt: Date; isWorking: boolean }>,
  visit: { scheduledStart: Date; scheduledEnd: Date }
) {
  const workingBlocks = blocks.filter((block) => block.isWorking);

  if (workingBlocks.length === 0) {
    return true;
  }

  return workingBlocks.some(
    (block) => block.startsAt <= visit.scheduledStart && block.endsAt >= visit.scheduledEnd
  );
}

function deriveVisitCoverageStatus(
  visit: ProviderOrderRow["visits"][number]
): ServiceOrderRecord["visits"][number]["coverageStatus"] {
  if (
    visit.status === PrismaVisitStatus.NO_SHOW ||
    (visit.status === PrismaVisitStatus.CANCELLED && Boolean(visit.assignedCarerId))
  ) {
    return "needs_replacement";
  }

  if (!visit.assignedCarerId) {
    const hoursToVisit = (visit.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursToVisit <= 24 ? "needs_replacement" : "uncovered";
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

function deriveOrderCoverageStatus(order: ProviderOrderRow): ServiceOrderRecord["coverageStatus"] {
  const visitStatuses = order.visits.map(deriveVisitCoverageStatus);

  if (visitStatuses.includes("needs_replacement")) {
    return "needs_replacement";
  }

  if (visitStatuses.includes("uncovered")) {
    return "uncovered";
  }

  if (visitStatuses.includes("at_risk")) {
    return "at_risk";
  }

  return "covered";
}

function derivePendingAction(order: ProviderOrderRow) {
  const visits = order.visits;

  if (visits.some((visit) => deriveVisitCoverageStatus(visit) === "needs_replacement")) {
    return "Replacement coverage must be coordinated now.";
  }

  if (visits.some((visit) => !visit.assignedCarerId)) {
    return "Assign the uncovered visit before the next service window.";
  }

  if (visits.some((visit) => visit.status === PrismaVisitStatus.UNDER_REVIEW)) {
    return "Move under-review visits to a final decision before closing.";
  }

  if (visits.some((visit) => visit.status === PrismaVisitStatus.COMPLETED)) {
    return "Push completed visits into review so they can be approved.";
  }

  return "Monitor execution and keep the order ready for closing.";
}

function getCredentialReason(
  credentials: Array<{ name: string; status: CredentialStatus }>,
  skill: string
) {
  const matching = credentials.filter(
    (credential) => credential.name.toLowerCase() === skill.toLowerCase()
  );

  if (matching.some((credential) => credential.status === CredentialStatus.EXPIRED)) {
    return `Expired credential for ${skill}`;
  }

  if (matching.some((credential) => credential.status === CredentialStatus.PENDING)) {
    return `Pending verification for ${skill}`;
  }

  if (matching.some((credential) => credential.status === CredentialStatus.REJECTED)) {
    return `Rejected credential for ${skill}`;
  }

  return `Missing skill ${skill}`;
}

function mapOrder(order: ProviderOrderRow): ServiceOrderRecord {
  const requiredSkills = order.requiredSkills;
  const requiredLanguage = order.requiredLanguage?.toLowerCase();
  const primaryVisit = order.visits.find((visit) => !visit.assignedCarerId) ?? order.visits[0];
  const eligibleCarers = order.provider.carers.map((carer) => {
    const validCredentials = carer.credentials.filter(
      (credential) => credential.status === CredentialStatus.VALID
    );
    const credentialNames = validCredentials.map((credential) => credential.name.toLowerCase());
    const missingSkills = requiredSkills.filter(
      (skill) => !credentialNames.includes(skill.toLowerCase())
    );
    const availabilityMatch = primaryVisit
      ? hasAvailabilityCoverage(carer.availabilityBlocks, primaryVisit)
      : true;
    const matchesLanguage =
      !requiredLanguage ||
      !carer.primaryLanguage ||
      carer.primaryLanguage.toLowerCase() === requiredLanguage;
    const eligibilityReasons = [
      ...missingSkills.map((skill) => getCredentialReason(carer.credentials, skill)),
      ...(availabilityMatch ? [] : ["No availability block covering the visit window"]),
      ...(matchesLanguage ? [] : [`Language mismatch for ${order.requiredLanguage}`])
    ];

    return {
      id: carer.id,
      name: `${carer.firstName} ${carer.lastName}`,
      credentials: validCredentials.map((credential) => credential.name),
      availability: carer.availabilityNote ?? "Availability to be confirmed",
      rating: carer.rating,
      isEligible: eligibilityReasons.length === 0,
      availabilityMatch,
      eligibilityReasons
    };
  });
  const coverageStatus = deriveOrderCoverageStatus(order);

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
    coverageStatus,
    pendingAction: derivePendingAction(order),
    escalationSummary:
      order.coordinatorNotes?.includes("Escalation") || order.priority === "CRITICAL"
        ? order.coordinatorNotes ?? "Critical order requiring escalation."
        : undefined,
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
      actualStart: visit.actualStart?.toISOString(),
      actualEnd: visit.actualEnd?.toISOString(),
      status: toLowerSnake(visit.status) as ServiceOrderRecord["visits"][number]["status"],
      coverageStatus: deriveVisitCoverageStatus(visit),
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
  const replacementNeeded = visits.filter(
    (visit) => visit.coverageStatus === "needs_replacement"
  ).length;
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
      label: "Coverage gaps",
      value: String(unassigned),
      tone: unassigned > 0 ? "critical" : "neutral",
      detail: "Visits still waiting for a confirmed carer"
    },
    {
      label: "Approved visits",
      value: String(approved),
      tone: "positive",
      detail: "Already ready for closing period"
    },
    {
      label: "Replacement required",
      value: String(replacementNeeded),
      tone: replacementNeeded > 0 ? "critical" : "positive",
      detail: "Assigned coverage broke and needs reassignment"
    },
    {
      label: "Critical coverage",
      value: String(criticalOrders),
      tone: criticalOrders > 0 ? "critical" : "positive",
      detail: "Orders needing escalation now"
    }
  ];
}

export async function listProviderActionQueue(providerId: string) {
  const orders = await listProviderOrders(providerId);

  return orders
    .map((order) => ({
      id: order.id,
      code: order.code,
      title: order.title,
      coverageStatus: order.coverageStatus,
      coverageRisk: order.coverageRisk,
      pendingAction: order.pendingAction,
      nextVisitLabel: order.visits[0]?.label ?? "No visits scheduled"
    }))
    .sort((left, right) => {
      const riskWeight = { critical: 0, warning: 1, stable: 2 };
      return riskWeight[left.coverageRisk] - riskWeight[right.coverageRisk];
    })
    .slice(0, 4);
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
  }>,
  periodVisits: Array<{
    id: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status: PrismaVisitStatus;
    assignedCarer: { firstName: string; lastName: string } | null;
    serviceOrder: {
      code: string;
      title: string;
      recipient: { firstName: string; lastName: string };
      serviceType: { name: string };
    };
  }>
): ClosingWorkspaceRecord["periods"][number] {
  const settlementByVisitId = new Map(period.settlements.map((settlement) => [settlement.visitId, settlement]));
  const exportJobs = period.exportJobs.map((job) => ({
    id: job.id,
    targetSystem: mapExportTarget(job.targetSystem),
    format: job.format,
    status: deriveExportJobStatus(job.status, job.externalStatus),
    attemptCount: job.attemptCount,
    exportBatchId: (job.payload as { exportBatchId?: string } | null)?.exportBatchId ?? getExportBatchId(period.id),
    externalReference: job.externalReference ?? undefined,
    lastError: job.lastError ?? undefined,
    queuedAt: job.queuedAt.toISOString(),
    nextAttemptAt: job.nextAttemptAt?.toISOString(),
    lastAttemptAt: job.lastAttemptAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    acknowledgedAt: job.acknowledgedAt?.toISOString(),
    connectorCode: job.connectorCode ?? undefined,
    connectorMessage: job.connectorMessage ?? undefined,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    attempts: job.attempts.map((attempt) => ({
      id: attempt.id,
      kind: mapExportJobAttemptKind(attempt.kind),
      result: mapExportJobAttemptResult(attempt.result),
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt.toISOString(),
      connectorCode: attempt.connectorCode ?? undefined,
      connectorMessage: attempt.connectorMessage ?? undefined,
      errorMessage: attempt.errorMessage ?? undefined,
      createdAt: attempt.createdAt.toISOString()
    }))
  }));
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
  const excludedVisits = periodVisits
    .filter((visit) => visit.status !== PrismaVisitStatus.APPROVED)
    .filter((visit) => isVisitInsidePeriod(visit, period))
    .map((visit) => ({
      id: visit.id,
      orderCode: visit.serviceOrder.code,
      orderTitle: visit.serviceOrder.title,
      recipientName: `${visit.serviceOrder.recipient.firstName} ${visit.serviceOrder.recipient.lastName}`,
      serviceType: visit.serviceOrder.serviceType.name,
      carerName: visit.assignedCarer
        ? `${visit.assignedCarer.firstName} ${visit.assignedCarer.lastName}`
        : undefined,
      status: toLowerSnake(visit.status) as ClosingWorkspaceRecord["periods"][number]["excludedVisits"][number]["status"],
      scheduledStart: visit.scheduledStart.toISOString(),
      scheduledEnd: visit.scheduledEnd.toISOString(),
      exclusionReason:
        visit.status === PrismaVisitStatus.UNDER_REVIEW
          ? "Review is still pending, so the visit cannot enter settlement yet."
          : visit.status === PrismaVisitStatus.REJECTED
            ? "The visit was rejected and must be corrected before it can be settled."
            : visit.status === PrismaVisitStatus.CANCELLED
              ? "Cancelled visits do not move into settlement."
              : visit.status === PrismaVisitStatus.NO_SHOW
                ? "No-show visits require operational handling, not settlement."
                : visit.status === PrismaVisitStatus.COMPLETED
                  ? "Completed visits still need to be submitted and approved."
                  : "This visit is not yet in an approvable state for settlement.",
      nextStep:
        visit.status === PrismaVisitStatus.UNDER_REVIEW
          ? "Reviewer must approve or reject the visit."
          : visit.status === PrismaVisitStatus.REJECTED
            ? "Coordinator should rework evidence or service execution before resubmitting."
            : visit.status === PrismaVisitStatus.CANCELLED
              ? "Leave it out of the period and manage replacement or cancellation follow-up."
              : visit.status === PrismaVisitStatus.NO_SHOW
                ? "Log replacement or escalation instead of settling it."
                : visit.status === PrismaVisitStatus.COMPLETED
                  ? "Move the visit to under review so it can be approved."
                  : "Advance the visit through the operational workflow first."
    }));

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
  const latestSuccessfulExport = period.exportJobs.find(
    (job) => job.status === PrismaExportJobStatus.SUCCEEDED
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
    excludedVisitsCount: excludedVisits.length,
    approvedMinutesTotal,
    billableCentsTotal,
    payableCentsTotal,
    expenseCentsTotal,
    latestSuccessfulExportAt: latestSuccessfulExport?.completedAt
      ? latestSuccessfulExport.completedAt.toISOString()
      : undefined,
    exportJobs,
    visits,
    excludedVisits
  };
}

export async function getProviderClosingWorkspace(
  providerId: string
): Promise<ClosingWorkspaceRecord> {
  noStore();

  const [periods, approvedVisits, periodVisits] = await Promise.all([
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
    }),
    prisma.visit.findMany({
      where: {
        serviceOrder: { providerId }
      },
      include: {
        assignedCarer: true,
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

  const mappedPeriods = periods.map((period) =>
    mapClosingPeriod(period, approvedVisits, periodVisits)
  );

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
      ),
      syncJobsPending: mappedPeriods.reduce(
        (total, period) =>
          total +
          period.exportJobs.filter(
            (job) => job.status === "queued" || job.status === "processing"
          ).length,
        0
      ),
      syncJobsFailed: mappedPeriods.reduce(
        (total, period) =>
          total + period.exportJobs.filter((job) => job.status === "failed").length,
        0
      ),
      syncJobsAwaitingAck: mappedPeriods.reduce(
        (total, period) =>
          total + period.exportJobs.filter((job) => job.status === "sent").length,
        0
      )
    }
  };
}

export async function getClosingExportPackage(
  periodId: string,
  providerId: string
): Promise<ClosingExportPackage | null> {
  noStore();

  const period = await prisma.closingPeriod.findFirst({
    where: {
      id: periodId,
      providerId
    },
    include: closingExportInclude
  });

  if (!period || period.status === PrismaClosingPeriodStatus.OPEN) {
    return null;
  }

  const visits = period.settlements.map((settlement) => {
    const visit = settlement.visit;
    const expenses = visit.expenses.map((expense) => ({
      id: expense.id,
      type: mapExpenseType(expense.type),
      amountCents: expense.amountCents,
      currency: expense.currency,
      note: expense.note ?? undefined,
      evidenceUrl: expense.evidenceUrl ?? undefined,
      createdAt: expense.createdAt.toISOString()
    }));

    return {
      visitId: visit.id,
      settlementId: settlement.id,
      serviceOrderId: visit.serviceOrderId,
      orderCode: visit.serviceOrder.code,
      orderTitle: visit.serviceOrder.title,
      recipientId: visit.serviceOrder.recipient.id,
      recipientExternalRef: visit.serviceOrder.recipient.externalRef ?? undefined,
      recipientName: `${visit.serviceOrder.recipient.firstName} ${visit.serviceOrder.recipient.lastName}`,
      assignedCarerId: visit.assignedCarerId ?? undefined,
      carerName: visit.assignedCarer
        ? `${visit.assignedCarer.firstName} ${visit.assignedCarer.lastName}`
        : undefined,
      serviceType: visit.serviceOrder.serviceType.name,
      scheduledStart: visit.scheduledStart.toISOString(),
      scheduledEnd: visit.scheduledEnd.toISOString(),
      actualStart: visit.actualStart?.toISOString(),
      actualEnd: visit.actualEnd?.toISOString(),
      approvedMinutes: settlement.approvedMinutes,
      billableCents: settlement.billableCents ?? 0,
      payableCents: settlement.payableCents ?? 0,
      currency: "AUD",
      expenses
    };
  });

  return {
    schemaVersion: "serenity-closing-export-v1",
    exportBatchId: getExportBatchId(period.id),
    generatedAt: new Date().toISOString(),
    provider: {
      id: period.provider.id,
      displayName: period.provider.displayName,
      legalName: period.provider.legalName,
      timezone: period.provider.timezone
    },
    closingPeriod: {
      id: period.id,
      label: period.label,
      status: mapClosingStatus(period.status),
      startsAt: period.startsAt.toISOString(),
      endsAt: period.endsAt.toISOString()
    },
    totals: {
      visits: visits.length,
      approvedMinutes: visits.reduce((total, visit) => total + visit.approvedMinutes, 0),
      billableCents: visits.reduce((total, visit) => total + visit.billableCents, 0),
      payableCents: visits.reduce((total, visit) => total + visit.payableCents, 0),
      expenseCents: visits.reduce(
        (total, visit) =>
          total + visit.expenses.reduce((expenseTotal, expense) => expenseTotal + expense.amountCents, 0),
        0
      )
    },
    visits
  };
}

export function serializeClosingExportCsv(payload: ClosingExportPackage) {
  const header = [
    "export_batch_id",
    "period_id",
    "period_label",
    "visit_id",
    "settlement_id",
    "service_order_id",
    "order_code",
    "recipient_id",
    "recipient_external_ref",
    "recipient_name",
    "carer_id",
    "carer_name",
    "service_type",
    "scheduled_start",
    "scheduled_end",
    "actual_start",
    "actual_end",
    "approved_minutes",
    "billable_cents",
    "payable_cents",
    "expense_total_cents",
    "expense_count"
  ];

  const escape = (value: string | number | undefined) =>
    `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;

  const rows = payload.visits.map((visit) => [
    payload.exportBatchId,
    payload.closingPeriod.id,
    payload.closingPeriod.label,
    visit.visitId,
    visit.settlementId,
    visit.serviceOrderId,
    visit.orderCode,
    visit.recipientId,
    visit.recipientExternalRef ?? "",
    visit.recipientName,
    visit.assignedCarerId ?? "",
    visit.carerName ?? "",
    visit.serviceType,
    visit.scheduledStart,
    visit.scheduledEnd,
    visit.actualStart ?? "",
    visit.actualEnd ?? "",
    visit.approvedMinutes,
    visit.billableCents,
    visit.payableCents,
    visit.expenses.reduce((total, expense) => total + expense.amountCents, 0),
    visit.expenses.length
  ]);

  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

function buildExportPayloadSummary(
  payload: ClosingExportPackage,
  targetSystem: ExportTargetSystem
) {
  return {
    schemaVersion: payload.schemaVersion,
    exportBatchId: payload.exportBatchId,
    targetSystem,
    totals: payload.totals,
    visitIds: payload.visits.map((visit) => visit.visitId)
  };
}

function buildConnectorRequestSummary(
  payload: ClosingExportPackage,
  targetSystem: ExportTargetSystem
) {
  return {
    targetSystem,
    exportBatchId: payload.exportBatchId,
    visitCount: payload.visits.length,
    totals: payload.totals
  };
}

async function createExportJobAttempt(params: {
  exportJobId: string;
  kind: PrismaExportJobAttemptKind;
  result: PrismaExportJobAttemptResult;
  startedAt: Date;
  completedAt: Date;
  connectorCode?: string;
  connectorMessage?: string;
  errorMessage?: string;
  requestPayload?: Prisma.InputJsonValue;
  responsePayload?: Prisma.InputJsonValue;
}) {
  return prisma.exportJobAttempt.create({
    data: {
      exportJobId: params.exportJobId,
      kind: params.kind,
      result: params.result,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      connectorCode: params.connectorCode,
      connectorMessage: params.connectorMessage,
      errorMessage: params.errorMessage,
      requestPayload: params.requestPayload,
      responsePayload: params.responsePayload
    }
  });
}

export async function createClosingExportJob(
  periodId: string,
  providerId: string,
  targetSystem: ExportTargetSystem
) {
  const payload = await getClosingExportPackage(periodId, providerId);

  if (!payload) {
    throw new Error("Closing period is not ready for external sync.");
  }

  const job = await prisma.exportJob.create({
    data: {
      closingPeriodId: periodId,
      targetSystem,
      format: "json",
      status: PrismaExportJobStatus.PENDING,
      externalStatus: PrismaExternalSyncStatus.NOT_SENT,
      nextAttemptAt: new Date(),
      payload: buildExportPayloadSummary(payload, targetSystem)
    }
  });

  return job;
}

export async function processClosingExportJob(jobId: string, providerId: string) {
  const job = await prisma.exportJob.findFirst({
    where: {
      id: jobId,
      closingPeriod: {
        providerId
      }
    },
    include: {
      closingPeriod: {
        select: {
          id: true
        }
      }
    }
  });

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  if (
    job.status === PrismaExportJobStatus.SUCCEEDED &&
    job.externalStatus !== PrismaExternalSyncStatus.REJECTED
  ) {
    throw new Error("This export job was already processed.");
  }

  const payload = await getClosingExportPackage(job.closingPeriod.id, providerId);

  if (!payload) {
    throw new Error("Closing period is not ready for processing.");
  }

  const startedAt = new Date();
  const requestPayload = buildConnectorRequestSummary(
    payload,
    mapExportTarget(job.targetSystem)
  );

  await prisma.exportJob.update({
    where: { id: job.id },
    data: {
      status: PrismaExportJobStatus.PROCESSING,
      attemptCount: { increment: 1 },
      lastAttemptAt: startedAt,
      nextAttemptAt: null,
      lastError: null,
      payload: buildExportPayloadSummary(payload, mapExportTarget(job.targetSystem))
    }
  });

  const result = await executeConnector(mapExportTarget(job.targetSystem), payload);
  const completedAt = new Date();

  if (result.jobStatus === "failed") {
    const updatedJob = await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: PrismaExportJobStatus.FAILED,
        externalStatus: PrismaExternalSyncStatus.REJECTED,
        connectorCode: result.connectorCode,
        connectorMessage: result.connectorMessage,
        lastError: result.lastError,
        externalReference: null,
        completedAt,
        acknowledgedAt: null
      }
    });

    await createExportJobAttempt({
      exportJobId: job.id,
      kind: PrismaExportJobAttemptKind.DELIVERY,
      result: PrismaExportJobAttemptResult.FAILED,
      startedAt,
      completedAt,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      errorMessage: result.lastError,
      requestPayload,
      responsePayload: {
        jobStatus: result.jobStatus,
        connectorCode: result.connectorCode,
        connectorMessage: result.connectorMessage,
        lastError: result.lastError
      }
    });

    return updatedJob;
  }

  const updatedJob = await prisma.exportJob.update({
    where: { id: job.id },
    data: {
      status: PrismaExportJobStatus.SUCCEEDED,
      externalStatus:
        result.jobStatus === "acknowledged"
          ? PrismaExternalSyncStatus.ACKNOWLEDGED
          : PrismaExternalSyncStatus.SENT,
      externalReference: result.externalReference,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      completedAt,
      acknowledgedAt: result.acknowledgedAt ?? null,
      nextAttemptAt:
        result.jobStatus === "acknowledged" ? null : getNextSyncCheckTime(completedAt),
      lastError: null
    }
  });

  await createExportJobAttempt({
    exportJobId: job.id,
    kind: PrismaExportJobAttemptKind.DELIVERY,
    result:
      result.jobStatus === "acknowledged"
        ? PrismaExportJobAttemptResult.ACKNOWLEDGED
        : PrismaExportJobAttemptResult.SENT,
    startedAt,
    completedAt,
    connectorCode: result.connectorCode,
    connectorMessage: result.connectorMessage,
    requestPayload,
    responsePayload: {
      jobStatus: result.jobStatus,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      externalReference: result.externalReference,
      acknowledgedAt: result.acknowledgedAt?.toISOString()
    }
  });

  return updatedJob;
}

export async function retryClosingExportJob(jobId: string, providerId: string) {
  const job = await prisma.exportJob.findFirst({
    where: {
      id: jobId,
      closingPeriod: {
        providerId
      }
    },
    include: {
      closingPeriod: {
        select: {
          id: true
        }
      }
    }
  });

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  const payload = await getClosingExportPackage(job.closingPeriod.id, providerId);

  if (!payload) {
    throw new Error("Closing period is not ready for retry.");
  }

  await prisma.exportJob.update({
    where: { id: job.id },
    data: {
      status: PrismaExportJobStatus.PENDING,
      externalStatus: PrismaExternalSyncStatus.NOT_SENT,
      lastError: null,
      connectorCode: null,
      connectorMessage: null,
      externalReference: null,
      completedAt: null,
      acknowledgedAt: null,
      nextAttemptAt: new Date(),
      payload: buildExportPayloadSummary(payload, mapExportTarget(job.targetSystem))
    }
  });

  return processClosingExportJob(job.id, providerId);
}

export async function acknowledgeClosingExportJob(
  jobId: string,
  providerId: string,
  resolution: "acknowledged" | "rejected"
) {
  const job = await prisma.exportJob.findFirst({
    where: {
      id: jobId,
      closingPeriod: {
        providerId
      }
    }
  });

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  if (job.status !== PrismaExportJobStatus.SUCCEEDED || job.externalStatus !== PrismaExternalSyncStatus.SENT) {
    throw new Error("Only sent jobs can be resolved externally.");
  }

  if (resolution === "acknowledged") {
    return prisma.exportJob.update({
      where: { id: job.id },
      data: {
        externalStatus: PrismaExternalSyncStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        nextAttemptAt: null,
        connectorMessage: "Remote system acknowledged the delivery."
      }
    });
  }

  return prisma.exportJob.update({
    where: { id: job.id },
    data: {
      status: PrismaExportJobStatus.FAILED,
      externalStatus: PrismaExternalSyncStatus.REJECTED,
      acknowledgedAt: null,
      nextAttemptAt: null,
      lastError: "Remote system rejected the payload after delivery.",
      connectorMessage: "Remote system rejected the delivery."
    }
  });
}

export async function checkClosingExportJobStatus(jobId: string, providerId: string) {
  const job = await prisma.exportJob.findFirst({
    where: {
      id: jobId,
      closingPeriod: {
        providerId
      }
    }
  });

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  if (
    job.status !== PrismaExportJobStatus.SUCCEEDED ||
    job.externalStatus !== PrismaExternalSyncStatus.SENT
  ) {
    throw new Error("Only sent jobs can be checked remotely.");
  }

  const startedAt = new Date();
  const result = await checkConnectorStatus(mapExportTarget(job.targetSystem));
  const completedAt = new Date();

  if (result.jobStatus === "failed") {
    const updatedJob = await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: PrismaExportJobStatus.FAILED,
        externalStatus: PrismaExternalSyncStatus.REJECTED,
        connectorCode: result.connectorCode,
        connectorMessage: result.connectorMessage,
        lastError: result.lastError,
        acknowledgedAt: null,
        nextAttemptAt: null
      }
    });

    await createExportJobAttempt({
      exportJobId: job.id,
      kind: PrismaExportJobAttemptKind.STATUS_CHECK,
      result: PrismaExportJobAttemptResult.FAILED,
      startedAt,
      completedAt,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      errorMessage: result.lastError,
      responsePayload: {
        jobStatus: result.jobStatus,
        connectorCode: result.connectorCode,
        connectorMessage: result.connectorMessage,
        lastError: result.lastError
      }
    });

    return updatedJob;
  }

  if (result.jobStatus === "sent") {
    const nextAttemptAt = getNextSyncCheckTime(completedAt);

    const updatedJob = await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        nextAttemptAt
      }
    });

    await createExportJobAttempt({
      exportJobId: job.id,
      kind: PrismaExportJobAttemptKind.STATUS_CHECK,
      result: PrismaExportJobAttemptResult.SENT,
      startedAt,
      completedAt,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      responsePayload: {
        jobStatus: result.jobStatus,
        connectorCode: result.connectorCode,
        connectorMessage: result.connectorMessage
      }
    });

    return updatedJob;
  }

  const updatedJob = await prisma.exportJob.update({
    where: { id: job.id },
    data: {
      externalStatus: PrismaExternalSyncStatus.ACKNOWLEDGED,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      acknowledgedAt: result.acknowledgedAt,
      nextAttemptAt: null,
      lastError: null
    }
  });

  await createExportJobAttempt({
    exportJobId: job.id,
    kind: PrismaExportJobAttemptKind.STATUS_CHECK,
    result: PrismaExportJobAttemptResult.ACKNOWLEDGED,
    startedAt,
    completedAt,
    connectorCode: result.connectorCode,
    connectorMessage: result.connectorMessage,
    responsePayload: {
      jobStatus: result.jobStatus,
      connectorCode: result.connectorCode,
      connectorMessage: result.connectorMessage,
      acknowledgedAt: result.acknowledgedAt.toISOString()
    }
  });

  return updatedJob;
}

export async function runQueuedClosingExportJobs(
  providerId: string,
  periodId: string,
  limit = 5
) {
  const jobs = await prisma.exportJob.findMany({
    where: {
      closingPeriodId: periodId,
      status: PrismaExportJobStatus.PENDING,
      closingPeriod: {
        providerId
      }
    },
    orderBy: [{ queuedAt: "asc" }],
    take: limit,
    select: { id: true }
  });

  const results = [];

  for (const job of jobs) {
    const updatedJob = await processClosingExportJob(job.id, providerId);
    results.push(updatedJob);
  }

  return {
    processedCount: results.length,
    acknowledgedCount: results.filter(
      (job) => job.externalStatus === PrismaExternalSyncStatus.ACKNOWLEDGED
    ).length,
    sentCount: results.filter((job) => job.externalStatus === PrismaExternalSyncStatus.SENT).length,
    failedCount: results.filter((job) => job.status === PrismaExportJobStatus.FAILED).length
  };
}

export async function runScheduledClosingExportCycle(limit = 10) {
  const now = new Date();
  const dueJobs = await prisma.exportJob.findMany({
    where: {
      nextAttemptAt: {
        lte: now
      },
      OR: [
        {
          status: PrismaExportJobStatus.PENDING
        },
        {
          status: PrismaExportJobStatus.SUCCEEDED,
          externalStatus: PrismaExternalSyncStatus.SENT
        }
      ]
    },
    include: {
      closingPeriod: {
        select: {
          id: true,
          providerId: true,
          label: true
        }
      }
    },
    orderBy: [{ nextAttemptAt: "asc" }, { queuedAt: "asc" }],
    take: limit
  });

  const summary = {
    scanned: dueJobs.length,
    processedQueued: 0,
    checkedSent: 0,
    acknowledged: 0,
    stillPending: 0,
    failed: 0
  };

  for (const job of dueJobs) {
    if (job.status === PrismaExportJobStatus.PENDING) {
      const updatedJob = await processClosingExportJob(job.id, job.closingPeriod.providerId);
      summary.processedQueued += 1;

      if (updatedJob.externalStatus === PrismaExternalSyncStatus.ACKNOWLEDGED) {
        summary.acknowledged += 1;
      } else if (updatedJob.externalStatus === PrismaExternalSyncStatus.SENT) {
        summary.stillPending += 1;
      } else {
        summary.failed += 1;
      }

      continue;
    }

    const updatedJob = await checkClosingExportJobStatus(job.id, job.closingPeriod.providerId);
    summary.checkedSent += 1;

    if (updatedJob.externalStatus === PrismaExternalSyncStatus.ACKNOWLEDGED) {
      summary.acknowledged += 1;
    } else if (
      updatedJob.status === PrismaExportJobStatus.SUCCEEDED &&
      updatedJob.externalStatus === PrismaExternalSyncStatus.SENT
    ) {
      const nextAttemptAt = getNextSyncCheckTime();
      await prisma.exportJob.update({
        where: { id: updatedJob.id },
        data: {
          nextAttemptAt
        }
      });
      summary.stillPending += 1;
    } else {
      summary.failed += 1;
    }
  }

  return summary;
}

export async function runSentClosingExportChecks(
  providerId: string,
  periodId: string,
  limit = 5
) {
  const jobs = await prisma.exportJob.findMany({
    where: {
      closingPeriodId: periodId,
      status: PrismaExportJobStatus.SUCCEEDED,
      externalStatus: PrismaExternalSyncStatus.SENT,
      closingPeriod: {
        providerId
      }
    },
    orderBy: [{ lastAttemptAt: "asc" }, { queuedAt: "asc" }],
    take: limit,
    select: { id: true }
  });

  const results = [];

  for (const job of jobs) {
    const updatedJob = await checkClosingExportJobStatus(job.id, providerId);
    results.push(updatedJob);
  }

  return {
    checkedCount: results.length,
    acknowledgedCount: results.filter(
      (job) => job.externalStatus === PrismaExternalSyncStatus.ACKNOWLEDGED
    ).length,
    failedCount: results.filter((job) => job.status === PrismaExportJobStatus.FAILED).length,
    stillPendingCount: results.filter(
      (job) => job.status === PrismaExportJobStatus.SUCCEEDED && job.externalStatus === PrismaExternalSyncStatus.SENT
    ).length
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

