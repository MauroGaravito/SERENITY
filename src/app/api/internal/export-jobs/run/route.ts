import { NextRequest, NextResponse } from "next/server";
import { runScheduledClosingExportCycle } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

function getInternalSyncSecret() {
  if (process.env.INTERNAL_SYNC_SECRET) {
    return process.env.INTERNAL_SYNC_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-dev-sync-secret";
  }

  throw new Error("INTERNAL_SYNC_SECRET is required in production");
}

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const syncHeader = request.headers.get("x-serenity-sync-secret");
  const expectedSecret = getInternalSyncSecret();

  if (syncHeader === expectedSecret) {
    return true;
  }

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length) === expectedSecret;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit =
    typeof body?.limit === "number" && Number.isFinite(body.limit) && body.limit > 0
      ? Math.min(Math.round(body.limit), 50)
      : 10;

  const summary = await runScheduledClosingExportCycle(limit);

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    limit,
    summary
  });
}
