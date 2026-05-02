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
import { redirect } from "next/navigation";

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

function parseServiceWindow(scheduledStart: string, scheduledEnd: string, plannedDurationMin: number) {
  const startsAt = new Date(scheduledStart);
  const endsAt = new Date(scheduledEnd);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Service window dates are invalid.");
  }

  if (endsAt <= startsAt) {
    throw new Error("Scheduled end must be after scheduled start.");
  }

  if (!Number.isFinite(plannedDurationMin) || plannedDurationMin <= 0) {
    throw new Error("Planned duration must be greater than zero.");
  }

  const windowMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);

  if (plannedDurationMin > windowMinutes) {
    throw new Error("Planned duration cannot exceed the scheduled window.");
  }

  return { endsAt, startsAt };
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
  const serviceWindow = parseServiceWindow(scheduledStart, scheduledEnd, plannedDurationMin);
  const priority = parsePriority(requiredString(formData.get("priority"), "priority"));
  const requiredSkills = parseRequiredSkills(formData);

  const [providerClient, facility, serviceType] = await Promise.all([
    prisma.providerClient.findFirst({
      where: {
        centerId,
        providerId,
        status: "active"
      },
      include: {
        provider: {
          select: {
            displayName: true,
            id: true
          }
        }
      }
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

  if (!providerClient) {
    throw new Error("Provider is not linked to this center.");
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
      startsOn: serviceWindow.startsAt,
      endsOn: serviceWindow.endsAt,
      recurrenceRule
    }
  });

  const visit = await prisma.visit.create({
    data: {
      serviceOrderId: order.id,
      status: PrismaVisitStatus.SCHEDULED,
      scheduledStart: serviceWindow.startsAt,
      scheduledEnd: serviceWindow.endsAt,
      exceptionReason: "Center request submitted and waiting for provider coverage."
    }
  });

  await logAuditEvent({
    organizationId: centerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    type: AuditEventType.ORDER_CREATED,
    summary: `${session.fullName} submitted ${code} from center demand to ${providerClient.provider.displayName}.`,
    payload: {
      centerId,
      facilityId,
      orderCode: code,
      providerId,
      recipientId,
      serviceTypeId
    }
  });

  await logAuditEvent({
    organizationId: centerId,
    actorUserId: session.userId,
    serviceOrderId: order.id,
    visitId: visit.id,
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
  redirect(`/centers/orders/${order.id}`);
}
