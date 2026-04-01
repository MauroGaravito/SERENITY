import { AuditEventType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditPayload = Record<string, string | number | boolean | null | string[]>;

export type AuditInput = {
  organizationId: string;
  actorUserId?: string;
  serviceOrderId?: string;
  visitId?: string;
  type: AuditEventType;
  summary: string;
  payload?: AuditPayload;
};

export async function logAuditEvent(input: AuditInput) {
  await prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      serviceOrderId: input.serviceOrderId,
      visitId: input.visitId,
      type: input.type,
      summary: input.summary,
      payload: input.payload
    }
  });
}

export function formatRoleLabel(role: UserRole) {
  return role.toLowerCase().replaceAll("_", " ");
}
