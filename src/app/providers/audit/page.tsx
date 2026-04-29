import Link from "next/link";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { listClosingAuditEvents } from "@/lib/audit-data";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { formatDateTime, toTitleCase } from "@/lib/providers";
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
  const latestEvent = events[0];

  return (
    <ProviderShell
      currentSection="audit"
      title="Audit trail"
      subtitle="Verify what changed, who changed it, and which closing/export evidence exists."
    >
      <section className="workflow-page audit-workflow">
        <article className="workflow-focus-card">
          <div>
            <p className="card-tag">Verification focus</p>
            <h2>{selectedPeriod ? `Evidence for ${selectedPeriod.label}` : "Select an audit period"}</h2>
            <p>
              {latestEvent
                ? `Latest recorded event: ${toTitleCase(latestEvent.type)} at ${formatDateTime(
                    latestEvent.createdAt
                  )}.`
                : "No period-level closing or export events have been recorded yet."}
            </p>
          </div>
          {selectedPeriod ? (
            <div className="workflow-focus-actions">
              <StatusBadge value={selectedPeriod.status} />
              <Link className="primary-link" href={`/providers/export?period=${selectedPeriod.id}`}>
                Open package
              </Link>
            </div>
          ) : null}
        </article>

        <section className="workflow-package-card">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Audit scope</p>
              <h2>{selectedPeriod?.label ?? "No period selected"}</h2>
              {selectedPeriod ? (
                <p className="panel-copy">
                  {formatDateTime(selectedPeriod.startsAt)} - {formatDateTime(selectedPeriod.endsAt)}
                </p>
              ) : null}
            </div>
            <div className="workflow-period-switcher">
              {workspace.periods.map((item) => (
                <Link
                  className={`period-chip ${selectedPeriod?.id === item.id ? "is-active" : ""}`}
                  href={`/providers/audit?period=${item.id}`}
                  key={item.id}
                >
                  <span>{item.label}</span>
                  <StatusBadge value={item.status} />
                </Link>
              ))}
            </div>
          </div>

          {selectedPeriod ? (
            <div className="package-metric-grid">
              <div>
                <span className="metric-icon metric-icon-visits" aria-hidden="true" />
                <strong>{events.length}</strong>
                <p>audit events</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-today" aria-hidden="true" />
                <strong>{selectedPeriod.exportJobs.length}</strong>
                <p>export jobs</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
                <strong>{selectedPeriod.approvedVisitsCount}</strong>
                <p>approved visits</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
                <strong>{selectedPeriod.excludedVisitsCount}</strong>
                <p>exceptions</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="workflow-work-card audit-evidence-card">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Timeline</p>
              <h2>Recorded changes</h2>
            </div>
            <span className="skill-pill">{events.length} events</span>
          </div>

          {events.length > 0 ? (
            <div className="audit-timeline">
              {events.map((event) => (
                <article className="audit-timeline-item" key={event.id}>
                  <div className="audit-node" aria-hidden="true" />
                  <div className="audit-event-card">
                    <div className="split-row">
                      <strong>{toTitleCase(event.type)}</strong>
                      <span className="skill-pill">{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p>{event.summary}</p>
                    {event.actorName ? (
                      <p>
                        {event.actorName}
                        {event.actorRole ? ` / ${event.actorRole}` : ""}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
              <strong>No recorded changes yet</strong>
              <p>This period has no closing/export audit events to review.</p>
            </div>
          )}
        </section>

        {selectedPeriod ? (
          <section className="workflow-work-card">
            <div className="section-title-row">
              <div>
                <p className="card-tag">Export evidence</p>
                <h2>Delivery records</h2>
              </div>
              <Link className="inline-link" href={`/providers/export?period=${selectedPeriod.id}`}>
                Manage delivery
              </Link>
            </div>
            <div className="delivery-job-list">
              {selectedPeriod.exportJobs.length > 0 ? (
                selectedPeriod.exportJobs.map((job) => (
                  <article className="delivery-job-card" key={job.id}>
                    <div className="delivery-job-main">
                      <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
                      <div>
                        <div className="split-row">
                          <strong>{job.targetSystem.replaceAll("_", " ")}</strong>
                          <StatusBadge value={job.status} />
                        </div>
                        <p>External ref: {job.externalReference ?? "Pending"}</p>
                        <p>{job.connectorMessage ?? job.lastError ?? "No connector message."}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="panel-copy">No export jobs are linked to this period.</p>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </ProviderShell>
  );
}
