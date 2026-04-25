import Link from "next/link";
import {
  CheckClosingSyncForm,
  CheckClosingSyncQueueForm,
  ClosingPeriodStatusForm,
  ClosingSyncForm,
  ProcessClosingSyncForm,
  ResolveClosingSyncForm,
  RetryClosingSyncForm,
  RunClosingSyncQueueForm
} from "@/components/providers/closing-forms";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/providers";
import { getProviderClosingWorkspace } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default async function ProviderExportPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const workspace = await getProviderClosingWorkspace(session.organizationId);
  const { period } = await searchParams;
  const exportablePeriods = workspace.periods.filter((item) => item.status !== "open");
  const selectedPeriod =
    exportablePeriods.find((item) => item.id === period) ?? exportablePeriods[0] ?? workspace.periods[0];
  const jobs = selectedPeriod?.exportJobs ?? [];
  const pendingJobs = jobs.filter((job) => ["queued", "sent", "failed"].includes(job.status)).length;

  return (
    <ProviderShell
      currentSection="export"
      title="External export"
      subtitle="Deliver locked closing periods to external finance systems."
    >
      <section className="closing-cockpit">
        <article className="closing-mission-panel">
          <div>
            <p className="card-tag">Export mission</p>
            <h2>{pendingJobs > 0 ? "Resolve export activity" : "Prepare external package"}</h2>
            <p className="panel-copy">
              Export starts after a period is locked. This page manages packages, sync jobs and
              acknowledgements without changing settlement values.
            </p>
          </div>
          {selectedPeriod ? (
            <div className="closing-mission-actions">
              <StatusBadge value={selectedPeriod.status} />
              <ClosingPeriodStatusForm period={selectedPeriod} />
            </div>
          ) : null}
        </article>

        <section className="closing-summary-row">
          <Link className="summary-stat-card" href="/providers/closing">
            <span>Open periods</span>
            <strong>{workspace.summary.periodsOpen}</strong>
            <p>Finish these in Closing first.</p>
          </Link>
          <a className="summary-stat-card summary-stat-card-positive" href="#export-package">
            <span>Ready for export</span>
            <strong>{workspace.summary.visitsReadyForExport}</strong>
            <p>Visits in locked or exported periods.</p>
          </a>
          <a className="summary-stat-card summary-stat-card-warning" href="#sync-jobs">
            <span>Awaiting sync</span>
            <strong>{workspace.summary.syncJobsPending + workspace.summary.syncJobsAwaitingAck}</strong>
            <p>Queued or sent jobs.</p>
          </a>
          <a className="summary-stat-card summary-stat-card-critical" href="#sync-jobs">
            <span>Failed jobs</span>
            <strong>{workspace.summary.syncJobsFailed}</strong>
            <p>Jobs that need retry or review.</p>
          </a>
        </section>
      </section>

      <section className="closing-workbench">
        <article className="ops-panel closing-period-selector">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Period</p>
              <h2>Select export period</h2>
            </div>
          </div>
          <div className="visit-list">
            {workspace.periods.map((item) => (
              <Link
                className={`visit-list-item ${selectedPeriod?.id === item.id ? "is-active" : ""}`}
                href={`/providers/export?period=${item.id}`}
                key={item.id}
              >
                <div>
                  <strong>{item.label}</strong>
                  <p>
                    {item.approvedVisitsCount} approved / {item.settledVisitsCount} settled
                  </p>
                </div>
                <StatusBadge value={item.status} />
              </Link>
            ))}
          </div>
        </article>

        {selectedPeriod ? (
          <article className="ops-panel" id="export-package">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Export package</p>
                <h2>{selectedPeriod.label}</h2>
                <p className="panel-copy">
                  {formatDateTime(selectedPeriod.startsAt)} - {formatDateTime(selectedPeriod.endsAt)}
                </p>
              </div>
              <StatusBadge value={selectedPeriod.status} />
            </div>
            <dl className="meta-grid closing-meta-grid">
              <div>
                <dt>Visits</dt>
                <dd>{selectedPeriod.approvedVisitsCount}</dd>
              </div>
              <div>
                <dt>Minutes</dt>
                <dd>{selectedPeriod.approvedMinutesTotal}</dd>
              </div>
              <div>
                <dt>Billable</dt>
                <dd>{formatCurrency(selectedPeriod.billableCentsTotal)}</dd>
              </div>
              <div>
                <dt>Payable</dt>
                <dd>{formatCurrency(selectedPeriod.payableCentsTotal)}</dd>
              </div>
              <div>
                <dt>Expenses</dt>
                <dd>{formatCurrency(selectedPeriod.expenseCentsTotal)}</dd>
              </div>
              <div>
                <dt>Jobs</dt>
                <dd>{jobs.length}</dd>
              </div>
            </dl>
            {selectedPeriod.status !== "open" ? (
              <div className="inline-actions top-gap">
                <Link className="primary-link" href={`/providers/closing/export/${selectedPeriod.id}`}>
                  Download JSON
                </Link>
                <Link
                  className="ghost-link"
                  href={`/providers/closing/export/${selectedPeriod.id}?format=csv`}
                >
                  Download CSV
                </Link>
              </div>
            ) : (
              <p className="panel-copy top-gap">Lock this period in Closing before exporting.</p>
            )}
          </article>
        ) : null}
      </section>

      {selectedPeriod ? (
        <section className="ops-panel" id="sync-jobs">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Sync jobs</p>
              <h2>External delivery</h2>
            </div>
          </div>

          {selectedPeriod.status !== "open" ? (
            <>
              <ClosingSyncForm periodId={selectedPeriod.id} />
              <div className="inline-actions top-gap">
                <RunClosingSyncQueueForm periodId={selectedPeriod.id} />
                <CheckClosingSyncQueueForm periodId={selectedPeriod.id} />
              </div>
            </>
          ) : (
            <p className="panel-copy">Open periods cannot be exported yet.</p>
          )}

          <div className="sequence-list top-gap">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div className="note-block" key={job.id}>
                  <div className="split-row">
                    <strong>{job.targetSystem.replaceAll("_", " ")}</strong>
                    <StatusBadge value={job.status} />
                  </div>
                  <p>
                    Attempts: {job.attemptCount} / External ref: {job.externalReference ?? "Pending"}
                  </p>
                  <p>{job.connectorMessage ?? job.lastError ?? "No connector message."}</p>
                  {job.status === "queued" ? (
                    <div className="top-gap">
                      <ProcessClosingSyncForm jobId={job.id} />
                    </div>
                  ) : null}
                  {job.status === "sent" ? (
                    <div className="inline-actions top-gap">
                      <CheckClosingSyncForm jobId={job.id} />
                      <ResolveClosingSyncForm jobId={job.id} resolution="acknowledged" />
                      <ResolveClosingSyncForm jobId={job.id} resolution="rejected" />
                    </div>
                  ) : null}
                  {job.status === "failed" ? (
                    <div className="top-gap">
                      <RetryClosingSyncForm jobId={job.id} />
                    </div>
                  ) : null}
                  {job.attempts.length > 0 ? (
                    <details className="top-gap">
                      <summary>Attempt history</summary>
                      <div className="sequence-list top-gap">
                        {job.attempts.map((attempt) => (
                          <div className="note-block compact-note-block" key={attempt.id}>
                            <strong>
                              {attempt.kind.replaceAll("_", " ")} / {attempt.result.replaceAll("_", " ")}
                            </strong>
                            <p>
                              {formatDateTime(attempt.startedAt)} - {formatDateTime(attempt.completedAt)}
                            </p>
                            <p>{attempt.connectorMessage ?? attempt.errorMessage ?? "No attempt message."}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="panel-copy">No sync jobs have been created for this period yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </ProviderShell>
  );
}
