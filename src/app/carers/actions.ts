"use server";

import {
  AuditEventType,
  ChecklistResult,
  CredentialStatus,
  IncidentSeverity,
  VisitStatus as PrismaVisitStatus
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CARER_ROLES, requireUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { syncServiceOrderStatus } from "@/lib/providers-data";
import { assertVisitTransition } from "@/lib/visit-state";

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
      serviceOrderId: true,
      status: true,
      assignedCarerId: true,
      actualStart: true,
      actualEnd: true
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
  if (value === "pending") {
    return "pending";
  }

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

async function assertVisitReadyForReview(visitId: string) {
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: {
      evidence: {
        select: { id: true }
      },
      checklistItems: {
        select: {
          id: true,
          templateItemId: true
        }
      },
      serviceOrder: {
        select: {
          serviceType: {
            select: {
              checklistTemplates: {
                take: 1,
                orderBy: { version: "desc" },
                select: {
                  items: {
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!visit) {
    throw new Error("Visit not found.");
  }

  const requiredTemplateItems =
    visit.serviceOrder.serviceType.checklistTemplates[0]?.items ?? [];
  const completedTemplateItemIds = new Set(
    visit.checklistItems.map((item) => item.templateItemId)
  );
  const missingChecklistItems = requiredTemplateItems.filter(
    (item) => !completedTemplateItemIds.has(item.id)
  );

  if (missingChecklistItems.length > 0) {
    throw new Error("Complete every checklist item before submitting the visit for review.");
  }

  if (visit.evidence.length === 0) {
    throw new Error("Capture at least one evidence item before submitting the visit for review.");
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

function parseCredentialStatus(value: string) {
  switch (value) {
    case "pending":
      return CredentialStatus.PENDING;
    case "valid":
      return CredentialStatus.VALID;
    case "expired":
      return CredentialStatus.EXPIRED;
    case "rejected":
      return CredentialStatus.REJECTED;
    default:
      throw new Error("Invalid credential status.");
  }
}

function optionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value.");
  }

  return parsed;
}

async function revalidateCarerPath() {
  revalidatePath("/carers");
  revalidatePath("/carers/availability");
  revalidatePath("/carers/credentials");
}

export async function updateCarerAvailabilityProfile(formData: FormData) {
  const session = await requireCarerSession();
  const availabilityNote = requiredString(formData.get("availabilityNote"), "availabilityNote");

  await prisma.carer.update({
    where: { id: session.carerId },
    data: {
      availabilityNote
    }
  });

  await revalidateCarerPath();
}

export async function addCarerAvailabilityBlock(formData: FormData) {
  const session = await requireCarerSession();
  const startsAt = optionalDate(formData.get("startsAt"));
  const endsAt = optionalDate(formData.get("endsAt"));
  const isWorking = String(formData.get("isWorking") ?? "working") === "working";

  if (!startsAt || !endsAt) {
    await revalidateCarerPath();
    return;
  }

  if (endsAt <= startsAt) {
    await revalidateCarerPath();
    return;
  }

  const overlappingBlock = await prisma.availabilityBlock.findFirst({
    where: {
      carerId: session.carerId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    },
    select: {
      id: true,
      isWorking: true,
      startsAt: true,
      endsAt: true
    }
  });

  if (overlappingBlock) {
    await revalidateCarerPath();
    return;
  }

  await prisma.availabilityBlock.create({
    data: {
      carerId: session.carerId,
      startsAt,
      endsAt,
      isWorking
    }
  });

  await revalidateCarerPath();
}

export async function deleteCarerAvailabilityBlock(formData: FormData) {
  const session = await requireCarerSession();
  const availabilityBlockId = requiredString(formData.get("availabilityBlockId"), "availabilityBlockId");

  await prisma.availabilityBlock.deleteMany({
    where: {
      id: availabilityBlockId,
      carerId: session.carerId
    }
  });

  await revalidateCarerPath();
}

export async function saveCarerCredential(formData: FormData) {
  const session = await requireCarerSession();
  const credentialId = optionalString(formData.get("credentialId"));
  const name = requiredString(formData.get("name"), "name");
  const status = parseCredentialStatus(requiredString(formData.get("status"), "status"));
  const issuedAt = optionalDate(formData.get("issuedAt"));
  const expiresAt = optionalDate(formData.get("expiresAt"));
  const documentUrl = optionalString(formData.get("documentUrl"));
  const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  if (credentialId) {
    await prisma.credential.updateMany({
      where: {
        id: credentialId,
        carerId: session.carerId
      },
      data: {
        code,
        name,
        status,
        issuedAt,
        expiresAt,
        documentUrl
      }
    });
  } else {
    await prisma.credential.create({
      data: {
        carerId: session.carerId,
        code,
        name,
        status,
        issuedAt,
        expiresAt,
        documentUrl
      }
    });
  }

  await revalidateCarerPath();
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
      await assertVisitReadyForReview(visit.id);
      status = PrismaVisitStatus.UNDER_REVIEW;
      data = { status };
      summary = "Carer submitted the visit for review.";
      break;
    default:
      throw new Error("Invalid status transition.");
  }

  assertVisitTransition({
    actor: "carer",
    assignedCarerId: visit.assignedCarerId,
    currentStatus: visit.status,
    hasActualStart: Boolean(visit.actualStart),
    hasActualEnd: Boolean(visit.actualEnd),
    nextStatus: status
  });

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
    if (result === "pending") {
      await prisma.visitChecklistItem.delete({
        where: { id: existingItem.id }
      });
      await revalidateCarerPath();
      return;
    }

    await prisma.visitChecklistItem.update({
      where: { id: existingItem.id },
      data: {
        result,
        note
      }
    });
  } else if (result !== "pending") {
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
