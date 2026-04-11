"use server";

import {
  AuditEventType,
  ChecklistResult,
  IncidentSeverity,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CARER_ROLES, requireUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { syncServiceOrderStatus } from "@/lib/providers-data";

async function requireCarerSession() {
  const session = await requireUser(CARER_ROLES);
  const carer = await prisma.carer.findFirst({
    where: {
      ownerUserId: session.userId,
      isActive: true
    },
    select: {
      id: true,
      providerId: true
    }
  });

  if (!carer) {
    throw new Error("Active carer profile not found.");
  }

  return {
    ...session,
    carerId: carer.id,
    providerId: carer.providerId ?? session.organizationId
  };
}

async function getScopedVisit(visitId: string, carerId: string) {
  return prisma.visit.findFirst({
    where: {
      id: visitId,
      assignedCarerId: carerId
    },
    select: {
      id: true,
      serviceOrderId: true
    }
  });
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

function toEvidenceUrl(value: string) {
  if (/^[a-z]+:\/\//i.test(value)) {
    return value;
  }

  return `manual://evidence/${encodeURIComponent(value)}`;
}

function parseChecklistResult(value: string) {
  switch (value) {
    case "pass":
      return ChecklistResult.PASS;
    case "fail":
      return ChecklistResult.FAIL;
    case "not_applicable":
      return ChecklistResult.NOT_APPLICABLE;
    default:
      throw new Error("Invalid checklist result.");
  }
}

function parseIncidentSeverity(value: string) {
  switch (value) {
    case "low":
      return IncidentSeverity.LOW;
    case "medium":
      return IncidentSeverity.MEDIUM;
    case "high":
      return IncidentSeverity.HIGH;
    case "critical":
      return IncidentSeverity.CRITICAL;
    default:
      return IncidentSeverity.MEDIUM;
  }
}

async function revalidateCarerPath() {
  revalidatePath("/carers");
}

export async function updateCarerVisitStatus(formData: FormData) {
  const session = await requireCarerSession();
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const action = requiredString(formData.get("statusAction"), "statusAction");
  const visit = await getScopedVisit(visitId, session.carerId);

  if (!visit) {
    throw new Error("Visit not found for this carer.");
  }

  let status: PrismaVisitStatus;
  let data: {
    status: PrismaVisitStatus;
    actualStart?: Date;
    actualEnd?: Date;
  };
  let summary: string;

  switch (action) {
    case "start":
      status = PrismaVisitStatus.IN_PROGRESS;
      data = {
        status,
        actualStart: new Date()
      };
      summary = "Carer started the assigned visit.";
      break;
    case "complete":
      status = PrismaVisitStatus.COMPLETED;
      data = {
        status,
        actualEnd: new Date()
      };
      summary = "Carer marked the visit as completed.";
      break;
    case "submit_review":
      status = PrismaVisitStatus.UNDER_REVIEW;
      data = { status };
      summary = "Carer submitted the visit for review.";
      break;
    default:
      throw new Error("Invalid status transition.");
  }

  await prisma.visit.update({
    where: { id: visit.id },
    data
  });

  if (session.providerId) {
    await logAuditEvent({
      organizationId: session.providerId,
      actorUserId: session.userId,
      serviceOrderId: visit.serviceOrderId,
      visitId: visit.id,
      type: AuditEventType.VISIT_STATUS_CHANGED,
      summary,
      payload: {
        actor: "carer",
        nextStatus: status.toLowerCase()
      }
    });
  }

  await syncServiceOrderStatus(visit.serviceOrderId);
  await revalidateCarerPath();
}

export async function saveVisitChecklistItem(formData: FormData) {
  const session = await requireCarerSession();
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const templateItemId = requiredString(formData.get("templateItemId"), "templateItemId");
  const result = parseChecklistResult(requiredString(formData.get("result"), "result"));
  const note = optionalString(formData.get("note"));
  const visit = await getScopedVisit(visitId, session.carerId);

  if (!visit) {
    throw new Error("Visit not found for this carer.");
  }

  const existingItem = await prisma.visitChecklistItem.findFirst({
    where: {
      visitId: visit.id,
      templateItemId
    },
    select: { id: true }
  });

  if (existingItem) {
    await prisma.visitChecklistItem.update({
      where: { id: existingItem.id },
      data: {
        result,
        note
      }
    });
  } else {
    await prisma.visitChecklistItem.create({
      data: {
        visitId: visit.id,
        templateItemId,
        result,
        note
      }
    });
  }

  await revalidateCarerPath();
}

export async function addVisitEvidence(formData: FormData) {
  const session = await requireCarerSession();
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const kind = requiredString(formData.get("kind"), "kind");
  const reference = requiredString(formData.get("reference"), "reference");
  const visit = await getScopedVisit(visitId, session.carerId);

  if (!visit) {
    throw new Error("Visit not found for this carer.");
  }

  await prisma.evidence.create({
    data: {
      visitId: visit.id,
      uploadedById: session.userId,
      kind,
      fileUrl: toEvidenceUrl(reference),
      capturedAt: new Date()
    }
  });

  if (session.providerId) {
    await logAuditEvent({
      organizationId: session.providerId,
      actorUserId: session.userId,
      serviceOrderId: visit.serviceOrderId,
      visitId: visit.id,
      type: AuditEventType.ORDER_UPDATED,
      summary: `Carer added ${kind} evidence to the visit.`,
      payload: {
        actor: "carer",
        kind
      }
    });
  }

  await revalidateCarerPath();
}

export async function reportVisitIncident(formData: FormData) {
  const session = await requireCarerSession();
  const visitId = requiredString(formData.get("visitId"), "visitId");
  const category = requiredString(formData.get("category"), "category");
  const severity = parseIncidentSeverity(requiredString(formData.get("severity"), "severity"));
  const summary = requiredString(formData.get("summary"), "summary");
  const visit = await getScopedVisit(visitId, session.carerId);

  if (!visit) {
    throw new Error("Visit not found for this carer.");
  }

  await prisma.incident.create({
    data: {
      visitId: visit.id,
      category,
      severity,
      summary,
      occurredAt: new Date()
    }
  });

  if (session.providerId) {
    await logAuditEvent({
      organizationId: session.providerId,
      actorUserId: session.userId,
      serviceOrderId: visit.serviceOrderId,
      visitId: visit.id,
      type: AuditEventType.ORDER_UPDATED,
      summary: `Carer reported an incident: ${category}.`,
      payload: {
        actor: "carer",
        category,
        severity: severity.toLowerCase()
      }
    });
  }

  await revalidateCarerPath();
}
