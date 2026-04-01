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
