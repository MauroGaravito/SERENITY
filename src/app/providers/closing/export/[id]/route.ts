import { AuditEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  getClosingExportPackage,
  serializeClosingExportCsv
} from "@/lib/providers-data";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const { id } = await context.params;
  const payload = await getClosingExportPackage(id, session.organizationId);

  if (!payload) {
    return NextResponse.json(
      { error: "Closing period is not ready for external export." },
      { status: 404 }
    );
  }

  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  await logAuditEvent({
    organizationId: session.organizationId,
    actorUserId: session.userId,
    type: AuditEventType.ORDER_UPDATED,
    summary: `Closing export package downloaded for ${payload.closingPeriod.label} (${format}).`,
    payload: {
      scope: "closing_export",
      periodId: payload.closingPeriod.id,
      exportBatchId: payload.exportBatchId,
      format,
      visits: payload.totals.visits
    }
  });

  if (format === "csv") {
    return new NextResponse(serializeClosingExportCsv(payload), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${payload.exportBatchId}.csv"`
      }
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="${payload.exportBatchId}.json"`
    }
  });
}
