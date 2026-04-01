"use server";

import {
  AuditEventType,
  PriorityLevel,
  ServiceOrderStatus,
  UserRole,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  PROVIDER_ROLES,
  requireOrganizationUser
} from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  syncServiceOrderStatus,
  toPrismaReviewOutcome,
  toPrismaVisitStatus
} from "@/lib/providers-data";
import { ReviewOutcome, VisitStatus } from "@/lib/providers";

type ProviderMutationInput = {
  visitId: string;
  path: string;
};

function revalidateProviderPaths(path?: string) {
  if (path) {
    revalidatePath(path);
  }

  revalidatePath("/providers");
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
  const requiredSkills = requiredString(formData.get("requiredSkills"), "requiredSkills")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

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
  const requiredSkills = requiredString(formData.get("requiredSkills"), "requiredSkills")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

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

