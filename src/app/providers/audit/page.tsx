import Link from "next/link";
import { OrderAuditTimeline } from "@/components/audit/order-audit-timeline";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { listClosingAuditEvents } from "@/lib/audit-data";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/providers";
import { getProviderClosingWorkspace } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default async function ProviderAuditPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const workspace = await getProviderClosingWorkspace(session.organizationId);
  const { period } = await searchParams;
  const selectedPeriod =
    workspace.periods.find((item) => item.id === period) ?? workspace.periods[0];
  const events = selectedPeriod
    ? await listClosingAuditEvents(selectedPeriod.id, session.organizationId)
    : [];

  return (
    <ProviderShell
      currentSection="audit"
      title="Audit trail"
      subtitle="Trace period-level closing and export events for compliance and dispute resolution."
    >
      <section className="closing-cockpit">
        <article className="closing-mission-panel">
          <div>
            <p className="card-tag">Traceability</p>
            <h2>{selectedPeriod ? selectedPeriod.label : "No period selected"}</h2>
            <p className="panel-copy">
              Review who changed closing data, when packages were downloaded and which operational
              events were recorded.
            </p>
          </div>
          {selectedPeriod ? <StatusBadge value={selectedPeriod.status} /> : null}
        </article>
      </section>

      <section className="closing-workbench">
        <article className="ops-panel closing-period-selector">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Period</p>
              <h2>Select audit scope</h2>
            </div>
          </div>
          <div className="visit-list">
            {workspace.periods.map((item) => (
              <Link
                className={`visit-list-item ${selectedPeriod?.id === item.id ? "is-active" : ""}`}
                href={`/providers/audit?period=${item.id}`}
                key={item.id}
              >
                <div>
                  <strong>{item.label}</strong>
                  <p>
                    {formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}
                  </p>
                </div>
                <StatusBadge value={item.status} />
              </Link>
            ))}
          </div>
        </article>

        <OrderAuditTimeline events={events} />
      </section>
    </ProviderShell>
  );
}
