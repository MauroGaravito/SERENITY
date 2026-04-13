"use server";

import {
  AuditEventType,
  ClosingPeriodStatus,
  ExpenseType,
  ExternalSyncStatus,
  ExportJobStatus,
  PriorityLevel,
  ServiceOrderStatus,
  UserRole,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SKILL_CATALOG } from "@/lib/catalogs";
import {
  PROVIDER_ROLES,
  requireOrganizationUser
} from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  acknowledgeClosingExportJob,
  createClosingExportJob,
  processClosingExportJob,
  retryClosingExportJob,
  syncServiceOrderStatus,
  toPrismaReviewOutcome,
  toPrismaVisitStatus
} from "@/lib/providers-data";
import { ExportTargetSystem, ReviewOutcome, VisitStatus } from "@/lib/providers";

type ProviderMutationInput = {
  visitId: string;
  path: string;
};

function getVisibleExportJobStatus(
  status: ExportJobStatus,
  externalStatus: ExternalSyncStatus
) {
  if (status === "PENDING") {
    return "queued";
  }

  if (status === "PROCESSING") {
    return "processing";
  }

  if (status === "FAILED" || externalStatus === "REJECTED") {
    return "failed";
  }

  if (externalStatus === "ACKNOWLEDGED") {
    return "acknowledged";
  }

  return "sent";
}

function revalidateProviderPaths(path?: string) {
  if (path) {
    revalidatePath(path);
  }

  revalidatePath("/providers");
  revalidatePath("/providers/closing");
  revalidatePath("/providers/orders");
}

async function requireProviderSession() {
  return requireOrganizationUser(PROVIDER_ROLES);
}

async function getScopedVisit(visitId: string, providerId: string) {
  return prisma.visit.findFirst({
    where: {
      id: visitId,
      serviceOrder: {
        providerId
      }
    },
    select: {
      id: true,
      serviceOrderId: true,
      serviceOrder: {
        select: {
          providerId: true
        }
      }
    }
  });
}

async function getScopedOrder(orderId: string, providerId: string) {
  return prisma.serviceOrder.findFirst({
    where: {
      id: orderId,
      providerId
    },
    select: {
      id: true,
      code: true,
      providerId: true
    }
  });
}

async function getScopedClosingPeriod(periodId: string, providerId: string) {
  return prisma.closingPeriod.findFirst({
    where: {
      id: periodId,
      providerId
    },
    select: {
      id: true,
      label: true,
      providerId: true,
      status: true,
      startsAt: true,
      endsAt: true
    }
  });
}

async function getScopedExportJob(jobId: string, providerId: string) {
  return prisma.exportJob.findFirst({
    where: {
      id: jobId,
      closingPeriod: {
        providerId
      }
    },
    select: {
      id: true,
      targetSystem: true,
      status: true,
      closingPeriodId: true,
      closingPeriod: {
        select: {
          label: true
        }
      }
    }
  });
}

async function getScopedApprovedVisitForClosing(visitId: string, providerId: string) {
  return prisma.visit.findFirst({
    where: {
      id: visitId,
      status: PrismaVisitStatus.APPROVED,
      serviceOrder: {
        providerId
      }
    },
    select: {
      id: true,
      assignedCarerId: true,
      serviceOrderId: true,
      actualEnd: true,
      scheduledEnd: true,
      serviceOrder: {
        select: {
          code: true
        }
      }
    }
  });
}

export async function assignCarerToVisit({
  visitId,
  carerId,
  path
}: ProviderMutationInput & { carerId: string }) {
  const session = await requireProviderSession();
  const providerId = session.organizationId;
  const [visit, carer] = await Promise.all([
    getScopedVisit(visitId, providerId),
    prisma.carer.findFirst({
      where: {
        id: carerId,
        providerId,
        isActive: true
      },
      select: { id: true, firstName: true, lastName: true }
    })
  ]);

  if (!visit) {
    throw new Error("Visit not found for this provider.");
  }

  if (!carer) {
    throw new Error("Carer is not available for this provider.");
  }

  await prisma.visit.update({
    where: { id: visit.id },
    data: {
      assignedCarerId: carer.id,
      status: toPrismaVisitStatus("confirmed")
    }
  });

  await logAuditEvent({
    organizationId: providerId,
    actorUserId: session.userId,
    serviceOrderId: visit.serviceOrderId,
    visitId: visit.id,
    type: AuditEventType.VISIT_ASSIGNED,
    summary: `Visit assigned to ${carer.firstName} ${carer.lastName}.`,
    payload: {
      carerId: carer.id
    }
  });

  await syncServiceOrderStatus(visit.serviceOrderId);
  revalidateProviderPaths(path);
}

export async function updateVisitStatus({
  visitId,
  status,
  path
}: ProviderMutationInput & { status: VisitStatus }) {
  const session = await requireProviderSession();
  const visit = await getScopedVisit(visitId, session.organizationId);

  if (!visit) {
    throw new Error("Visit not found for this provider.");
  }

  await prisma.visit.update({
    where: { id: visit.id },
    data: {
      status: toPrismaVisitStatus(status)
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    serviceOrderId: visit.serviceOrderId,
    visitId: visit.id,
    type: AuditEventType.VISIT_STATUS_CHANGED,
    summary: `Visit status changed to ${status}.`,
    payload: {
      status
    }
  });

  await syncServiceOrderStatus(visit.serviceOrderId);
  revalidateProviderPaths(path);
}

export async function reviewVisit({
  visitId,
  outcome,
  path
}: ProviderMutationInput & { outcome: ReviewOutcome }) {
  const reviewer = await requireOrganizationUser([UserRole.PROVIDER_REVIEWER]);
  const visit = await getScopedVisit(visitId, reviewer.organizationId);

  if (!visit) {
    throw new Error("Visit not found for this provider.");
  }

  await prisma.review.create({
    data: {
      visitId,
      reviewerId: reviewer.userId,
      outcome: toPrismaReviewOutcome(outcome),
      notes:
        outcome === "approved"
          ? "Visit approved after evidence check."
          : outcome === "rejected"
            ? "Visit rejected pending correction."
            : "Visit returned for operational changes."
    }
  });

  await prisma.visit.update({
    where: { id: visit.id },
    data: {
      status:
        outcome === "approved"
          ? toPrismaVisitStatus("approved")
          : toPrismaVisitStatus("rejected")
    }
  });

  await logAuditEvent({
    organizationId: reviewer.organizationId,
    actorUserId: reviewer.userId,
    serviceOrderId: visit.serviceOrderId,
    visitId,
    type: AuditEventType.VISIT_REVIEWED,
    summary: `Visit reviewed with outcome ${outcome}.`,
    payload: {
      outcome
    }
  });

  await syncServiceOrderStatus(visit.serviceOrderId);
  revalidateProviderPaths(path);
}

function requiredString(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${field}`);
  }

  return value.trim();
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequiredSkills(formData: FormData) {
  const skills = formData
    .getAll("requiredSkills")
    .filter((value): value is string => typeof value === "string")
    .map((skill) => skill.trim())
    .filter((skill): skill is (typeof SKILL_CATALOG)[number] =>
      SKILL_CATALOG.includes(skill as (typeof SKILL_CATALOG)[number])
    );

  if (skills.length === 0) {
    throw new Error("Select at least one required skill.");
  }

  return skills;
}

function parsePriority(value: string) {
  switch (value) {
    case "low":
      return PriorityLevel.LOW;
    case "medium":
      return PriorityLevel.MEDIUM;
    case "high":
      return PriorityLevel.HIGH;
    case "critical":
      return PriorityLevel.CRITICAL;
    default:
      return PriorityLevel.MEDIUM;
  }
}

function parseClosingStatusAction(value: string) {
  switch (value) {
    case "open":
      return ClosingPeriodStatus.OPEN;
    case "lock":
      return ClosingPeriodStatus.LOCKED;
    case "export":
      return ClosingPeriodStatus.EXPORTED;
    default:
      throw new Error("Invalid closing period action.");
  }
}

function parseExpenseType(value: string) {
  switch (value) {
    case "mileage":
      return ExpenseType.MILEAGE;
    case "travel":
      return ExpenseType.TRAVEL;
    case "supplies":
      return ExpenseType.SUPPLIES;
    case "other":
      return ExpenseType.OTHER;
    default:
      throw new Error("Invalid expense type.");
  }
}

function parseExportTargetSystem(value: string): ExportTargetSystem {
  switch (value) {
    case "manual_handoff":
    case "mock_payroll_gateway":
    case "qa_failure_simulation":
      return value;
    default:
      throw new Error("Invalid external target system.");
  }
}

function parseExternalResolution(value: string) {
  switch (value) {
    case "acknowledged":
    case "rejected":
      return value;
    default:
      throw new Error("Invalid external resolution.");
  }
}

function parsePositiveInt(value: string, field: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric field: ${field}`);
  }

  return Math.round(parsed);
}

function parseAmountToCents(value: string, field: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid amount field: ${field}`);
  }

  return Math.round(parsed * 100);
}

export async function createServiceOrder(formData: FormData) {
  const session = await requireProviderSession();
  const providerId = session.organizationId;
  const centerId = requiredString(formData.get("centerId"), "centerId");
  const facilityId = requiredString(formData.get("facilityId"), "facilityId");
  const recipientId = requiredString(formData.get("recipientId"), "recipientId");
  const serviceTypeId = requiredString(formData.get("serviceTypeId"), "serviceTypeId");
  const title = requiredString(formData.get("title"), "title");
  const scheduledStart = requiredString(formData.get("scheduledStart"), "scheduledStart");
  const scheduledEnd = requiredString(formData.get("scheduledEnd"), "scheduledEnd");
  const recurrenceRule = requiredString(formData.get("recurrenceRule"), "recurrenceRule");
  const plannedDurationMin = Number(
    requiredString(formData.get("plannedDurationMin"), "plannedDurationMin")
  );
  const priority = parsePriority(requiredString(formData.get("priority"), "priority"));
  const requiredSkills = parseRequiredSkills(formData);

  const [facility, serviceType] = await Promise.all([
    prisma.facility.findFirst({
      where: {
        id: facilityId,
        organizationId: centerId,
        recipients: {
          some: { id: recipientId }
        }
      },
      select: { id: true }
    }),
    prisma.serviceType.findUnique({
      where: { id: serviceTypeId },
      select: { id: true }
    })
  ]);

  if (!facility) {
    throw new Error("Facility and recipient do not match the selected center.");
  }

  if (!serviceType) {
    throw new Error("Service type not found.");
  }

  const codeSeed = await prisma.serviceOrder.count({ where: { providerId } });
  const code = `SR-${2400 + codeSeed + 1}`;

  const order = await prisma.serviceOrder.create({
    data: {
      code,
      centerId,
      providerId,
      recipientId,
      facilityId,
      serviceTypeId,
      status: ServiceOrderStatus.OPEN,
      priority,
      title,
      instructions: optionalString(formData.get("instructions")),
      coordinatorNotes: optionalString(formData.get("coordinatorNotes")),
      requiredSkills,
      requiredLanguage: optionalString(formData.get("requiredLanguage")),
      plannedDurationMin,
      startsOn: new Date(scheduledStart),
      endsOn: new Date(scheduledEnd),
      recurrenceRule
    }
  });

  await prisma.visit.create({
    data: {
      serviceOrderId: order.id,
      status: PrismaVisitStatus.SCHEDULED,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      exceptionReason: "Newly created order awaiting assignment."
    }
  });

  await logAuditEvent({
    organizationId: providerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.ORDER_CREATED,
    summary: `Provider created service order ${code} for center ${centerId}.`,
    payload: {
      orderCode: code,
      centerId,
      recipientId
    }
  });

  await logAuditEvent({
    organizationId: providerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.VISIT_CREATED,
    summary: "Initial visit created for the new provider order.",
    payload: {
      scheduledStart,
      scheduledEnd
    }
  });

  await syncServiceOrderStatus(order.id);
  revalidateProviderPaths();
}

export async function updateServiceOrder(formData: FormData) {
  const session = await requireProviderSession();
  const orderId = requiredString(formData.get("orderId"), "orderId");
  const title = requiredString(formData.get("title"), "title");
  const recurrenceRule = requiredString(formData.get("recurrenceRule"), "recurrenceRule");
  const plannedDurationMin = Number(
    requiredString(formData.get("plannedDurationMin"), "plannedDurationMin")
  );
  const priority = parsePriority(requiredString(formData.get("priority"), "priority"));
  const requiredSkills = parseRequiredSkills(formData);

  const order = await getScopedOrder(orderId, session.organizationId);

  if (!order) {
    throw new Error("Order not found for this provider.");
  }

  await prisma.serviceOrder.update({
    where: { id: order.id },
    data: {
      title,
      priority,
      recurrenceRule,
      plannedDurationMin,
      requiredLanguage: optionalString(formData.get("requiredLanguage")),
      instructions: optionalString(formData.get("instructions")),
      coordinatorNotes: optionalString(formData.get("coordinatorNotes")),
      requiredSkills
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Order ${order.code} updated by provider.`,
    payload: {
      title,
      priority: priority.toLowerCase(),
      plannedDurationMin
    }
  });

  revalidateProviderPaths(`/providers/orders/${order.id}`);
}

export async function createVisitForOrder(formData: FormData) {
  const session = await requireProviderSession();
  const orderId = requiredString(formData.get("orderId"), "orderId");
  const scheduledStart = requiredString(formData.get("scheduledStart"), "scheduledStart");
  const scheduledEnd = requiredString(formData.get("scheduledEnd"), "scheduledEnd");
  const note = optionalString(formData.get("exceptionReason"));

  const order = await getScopedOrder(orderId, session.organizationId);

  if (!order) {
    throw new Error("Order not found for this provider.");
  }

  await prisma.visit.create({
    data: {
      serviceOrderId: order.id,
      status: PrismaVisitStatus.SCHEDULED,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      exceptionReason: note ?? "Additional visit awaiting assignment."
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.VISIT_CREATED,
    summary: "Additional visit created for the order.",
    payload: {
      scheduledStart,
      scheduledEnd
    }
  });

  await syncServiceOrderStatus(order.id);
  revalidateProviderPaths(`/providers/orders/${order.id}`);
}

export async function saveVisitSettlement(formData: FormData) {
  const session = await requireProviderSession();
  const periodId = requiredString(formData.get("periodId"), "periodId");
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const approvedMinutes = parsePositiveInt(
    requiredString(formData.get("approvedMinutes"), "approvedMinutes"),
    "approvedMinutes"
  );
  const billableCents = parseAmountToCents(
    requiredString(formData.get("billableAmount"), "billableAmount"),
    "billableAmount"
  );
  const payableCents = parseAmountToCents(
    requiredString(formData.get("payableAmount"), "payableAmount"),
    "payableAmount"
  );

  const [period, visit] = await Promise.all([
    getScopedClosingPeriod(periodId, session.organizationId),
    getScopedApprovedVisitForClosing(visitId, session.organizationId)
  ]);

  if (!period) {
    throw new Error("Closing period not found for this provider.");
  }

  if (!visit) {
    throw new Error("Approved visit not found for this provider.");
  }

  if (period.status !== ClosingPeriodStatus.OPEN) {
    throw new Error("Only open periods can be edited.");
  }

  const visitEnd = visit.actualEnd ?? visit.scheduledEnd;

  if (visitEnd < period.startsAt || visitEnd > period.endsAt) {
    throw new Error("Visit does not belong to the selected closing period.");
  }

  await prisma.visitSettlement.upsert({
    where: {
      closingPeriodId_visitId: {
        closingPeriodId: period.id,
        visitId: visit.id
      }
    },
    update: {
      approvedMinutes,
      billableCents,
      payableCents
    },
    create: {
      closingPeriodId: period.id,
      visitId: visit.id,
      approvedMinutes,
      billableCents,
      payableCents
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    serviceOrderId: visit.serviceOrderId,
    visitId: visit.id,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Closing settlement saved for ${visit.serviceOrder.code} in ${period.label}.`,
    payload: {
      periodId: period.id,
      approvedMinutes,
      billableCents,
      payableCents
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${period.id}&visit=${visit.id}`);
}

export async function addVisitExpense(formData: FormData) {
  const session = await requireProviderSession();
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const periodId = requiredString(formData.get("periodId"), "periodId");
  const type = parseExpenseType(requiredString(formData.get("type"), "type"));
  const amountCents = parseAmountToCents(
    requiredString(formData.get("amount"), "amount"),
    "amount"
  );
  const note = optionalString(formData.get("note"));
  const evidenceUrl = optionalString(formData.get("evidenceUrl"));
  const [period, visit] = await Promise.all([
    getScopedClosingPeriod(periodId, session.organizationId),
    getScopedApprovedVisitForClosing(visitId, session.organizationId)
  ]);

  if (!period) {
    throw new Error("Closing period not found for this provider.");
  }

  if (!visit) {
    throw new Error("Approved visit not found for this provider.");
  }

  if (period.status !== ClosingPeriodStatus.OPEN) {
    throw new Error("Only open periods can be edited.");
  }

  if (!visit.assignedCarerId) {
    throw new Error("Expenses can only be attached to visits with an assigned carer.");
  }

  await prisma.expense.create({
    data: {
      visitId: visit.id,
      carerId: visit.assignedCarerId,
      type,
      amountCents,
      currency: "AUD",
      note,
      evidenceUrl
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    serviceOrderId: visit.serviceOrderId,
    visitId: visit.id,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Expense added to ${visit.serviceOrder.code} for operational closing.`,
    payload: {
      type: type.toLowerCase(),
      amountCents
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${periodId}&visit=${visit.id}`);
}

export async function syncClosingPeriodExternally(formData: FormData) {
  const session = await requireProviderSession();
  const periodId = requiredString(formData.get("periodId"), "periodId");
  const targetSystem = parseExportTargetSystem(
    requiredString(formData.get("targetSystem"), "targetSystem")
  );
  const period = await getScopedClosingPeriod(periodId, session.organizationId);

  if (!period) {
    throw new Error("Closing period not found for this provider.");
  }

  if (period.status === ClosingPeriodStatus.OPEN) {
    throw new Error("Lock the closing period before syncing externally.");
  }

  const job = await createClosingExportJob(period.id, session.organizationId, targetSystem);

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Closing period ${period.label} queued for ${targetSystem} sync.`,
    payload: {
      scope: "closing_sync",
      periodId: period.id,
      jobId: job.id,
      targetSystem,
      status: getVisibleExportJobStatus(job.status, job.externalStatus)
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${period.id}`);
}

export async function processClosingPeriodSync(formData: FormData) {
  const session = await requireProviderSession();
  const jobId = requiredString(formData.get("jobId"), "jobId");
  const job = await getScopedExportJob(jobId, session.organizationId);

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  const updatedJob = await processClosingExportJob(job.id, session.organizationId);

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary:
      getVisibleExportJobStatus(updatedJob.status, updatedJob.externalStatus) !== "failed"
        ? `Closing period ${job.closingPeriod.label} delivered to ${job.targetSystem}.`
        : `Closing period ${job.closingPeriod.label} delivery failed for ${job.targetSystem}.`,
    payload: {
      scope: "closing_sync_delivery",
      periodId: job.closingPeriodId,
      jobId: job.id,
      targetSystem: job.targetSystem,
      status: getVisibleExportJobStatus(updatedJob.status, updatedJob.externalStatus),
      externalReference: updatedJob.externalReference ?? null,
      error: updatedJob.lastError ?? null
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${job.closingPeriodId}`);
}

export async function retryClosingPeriodSync(formData: FormData) {
  const session = await requireProviderSession();
  const jobId = requiredString(formData.get("jobId"), "jobId");
  const job = await getScopedExportJob(jobId, session.organizationId);

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  const updatedJob = await retryClosingExportJob(job.id, session.organizationId);

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary:
      getVisibleExportJobStatus(updatedJob.status, updatedJob.externalStatus) !== "failed"
        ? `Retry succeeded for ${job.closingPeriod.label} sync.`
        : `Retry failed for ${job.closingPeriod.label} sync.`,
    payload: {
      scope: "closing_sync_retry",
      periodId: job.closingPeriodId,
      jobId: job.id,
      targetSystem: job.targetSystem,
      status: getVisibleExportJobStatus(updatedJob.status, updatedJob.externalStatus),
      externalReference: updatedJob.externalReference ?? null,
      error: updatedJob.lastError ?? null
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${job.closingPeriodId}`);
}

export async function resolveClosingPeriodSync(formData: FormData) {
  const session = await requireProviderSession();
  const jobId = requiredString(formData.get("jobId"), "jobId");
  const resolution = parseExternalResolution(
    requiredString(formData.get("resolution"), "resolution")
  );
  const job = await getScopedExportJob(jobId, session.organizationId);

  if (!job) {
    throw new Error("Export job not found for this provider.");
  }

  const updatedJob = await acknowledgeClosingExportJob(job.id, session.organizationId, resolution);

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary:
      resolution === "acknowledged"
        ? `Remote acknowledgement received for ${job.closingPeriod.label}.`
        : `Remote rejection received for ${job.closingPeriod.label}.`,
    payload: {
      scope: "closing_sync_acknowledgement",
      periodId: job.closingPeriodId,
      jobId: job.id,
      targetSystem: job.targetSystem,
      status: getVisibleExportJobStatus(updatedJob.status, updatedJob.externalStatus),
      externalReference: updatedJob.externalReference ?? null,
      error: updatedJob.lastError ?? null
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${job.closingPeriodId}`);
}

export async function updateClosingPeriodStatus(formData: FormData) {
  const session = await requireProviderSession();
  const periodId = requiredString(formData.get("periodId"), "periodId");
  const nextStatus = parseClosingStatusAction(
    requiredString(formData.get("statusAction"), "statusAction")
  );
  const period = await getScopedClosingPeriod(periodId, session.organizationId);

  if (!period) {
    throw new Error("Closing period not found for this provider.");
  }

  if (nextStatus === ClosingPeriodStatus.LOCKED) {
    const approvedVisits = await prisma.visit.findMany({
      where: {
        status: PrismaVisitStatus.APPROVED,
        serviceOrder: {
          providerId: session.organizationId
        }
      },
      select: {
        id: true,
        actualEnd: true,
        scheduledEnd: true
      }
    });

    const approvedVisitIds = approvedVisits
      .filter((visit) => {
        const comparisonDate = visit.actualEnd ?? visit.scheduledEnd;
        return comparisonDate >= period.startsAt && comparisonDate <= period.endsAt;
      })
      .map((visit) => visit.id);

    const settlementsCount = await prisma.visitSettlement.count({
      where: {
        closingPeriodId: period.id,
        visitId: {
          in: approvedVisitIds
        }
      }
    });

    if (settlementsCount !== approvedVisitIds.length) {
      throw new Error("All approved visits in the period need a settlement before locking.");
    }
  }

  if (nextStatus === ClosingPeriodStatus.EXPORTED && period.status !== ClosingPeriodStatus.LOCKED) {
    throw new Error("Only locked periods can be marked as exported.");
  }

  if (nextStatus === ClosingPeriodStatus.EXPORTED) {
    const acknowledgedJobs = await prisma.exportJob.count({
      where: {
        closingPeriodId: period.id,
        externalStatus: "ACKNOWLEDGED"
      }
    });

    if (acknowledgedJobs === 0) {
      throw new Error("Wait for at least one external acknowledgement before marking exported.");
    }
  }

  await prisma.closingPeriod.update({
    where: { id: period.id },
    data: {
      status: nextStatus
    }
  });

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Closing period ${period.label} moved to ${nextStatus.toLowerCase()}.`,
    payload: {
      periodId: period.id,
      status: nextStatus.toLowerCase()
    }
  });

  revalidateProviderPaths(`/providers/closing?period=${period.id}`);
}

