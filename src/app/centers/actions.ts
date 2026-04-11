"use server";

import {
  AuditEventType,
  PriorityLevel,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CENTER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  createCenterOrderCode,
  syncServiceOrderStatus
} from "@/lib/centers-data";
import { SKILL_CATALOG } from "@/lib/catalogs";
import { prisma } from "@/lib/prisma";

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

export async function createCenterServiceOrder(formData: FormData) {
  const session = await requireOrganizationUser(CENTER_ROLES);
  const centerId = session.organizationId;
  const providerId = requiredString(formData.get("providerId"), "providerId");
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

  const [provider, facility, serviceType] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: providerId,
        kind: "PROVIDER"
      },
      select: { id: true }
    }),
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

  if (!provider) {
    throw new Error("Provider not found.");
  }

  if (!facility) {
    throw new Error("Facility and recipient do not match this center.");
  }

  if (!serviceType) {
    throw new Error("Service type not found.");
  }

  const code = await createCenterOrderCode();

  const order = await prisma.serviceOrder.create({
    data: {
      code,
      centerId,
      providerId,
      recipientId,
      facilityId,
      serviceTypeId,
      status: "OPEN",
      priority,
      title,
      instructions: optionalString(formData.get("instructions")),
      coordinatorNotes: optionalString(formData.get("handoffNote")),
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
      exceptionReason: "Center request submitted and waiting for provider coverage."
    }
  });

  await logAuditEvent({
    organizationId: centerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.ORDER_CREATED,
    summary: `Center submitted service order ${code} to provider ${providerId}.`,
    payload: {
      orderCode: code,
      providerId,
      recipientId
    }
  });

  await logAuditEvent({
    organizationId: centerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.VISIT_CREATED,
    summary: "Initial visit request created from center demand.",
    payload: {
      scheduledStart,
      scheduledEnd
    }
  });

  await syncServiceOrderStatus(order.id);

  revalidatePath("/centers");
  revalidatePath("/centers/orders");
  revalidatePath("/providers");
  revalidatePath("/providers/orders");
}
