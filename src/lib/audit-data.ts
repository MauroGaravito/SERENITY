import { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { formatRoleLabel } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { AuditEventRecord } from "@/lib/providers";

const auditInclude = {
  actorUser: {
    select: {
      fullName: true,
      role: true
    }
  }
} satisfies Prisma.AuditEventInclude;

export async function listOrderAuditEvents(
  serviceOrderId: string,
  organizationId: string
): Promise<AuditEventRecord[]> {
  noStore();

  const events = await prisma.auditEvent.findMany({
    where: {
      serviceOrderId,
      serviceOrder: {
        OR: [{ centerId: organizationId }, { providerId: organizationId }]
      }
    },
    include: auditInclude,
    orderBy: { createdAt: "desc" },
    take: 12
  });

  return events.map((event) => ({
    id: event.id,
    type: event.type.toLowerCase() as AuditEventRecord["type"],
    summary: event.summary,
    createdAt: event.createdAt.toISOString(),
    actorName: event.actorUser?.fullName,
    actorRole: event.actorUser ? formatRoleLabel(event.actorUser.role) : undefined
  }));
}

export async function listClosingAuditEvents(
  periodId: string,
  organizationId: string
): Promise<AuditEventRecord[]> {
  noStore();

  const events = await prisma.auditEvent.findMany({
    where: {
      organizationId,
      type: {
        in: ["ORDER_UPDATED", "VISIT_REVIEWED"]
      }
    },
    include: auditInclude,
    orderBy: { createdAt: "desc" },
    take: 24
  });

  return events
    .filter((event) => {
      const payload = event.payload as Record<string, unknown> | null;
      return payload?.periodId === periodId || payload?.closingPeriodId === periodId;
    })
    .map((event) => ({
      id: event.id,
      type: event.type.toLowerCase() as AuditEventRecord["type"],
      summary: event.summary,
      createdAt: event.createdAt.toISOString(),
      actorName: event.actorUser?.fullName,
      actorRole: event.actorUser ? formatRoleLabel(event.actorUser.role) : undefined
    }));
}
