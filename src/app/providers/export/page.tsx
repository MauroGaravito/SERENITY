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

function getJobActionLabel(status: string) {
  if (status === "failed") {
    return "Retry required";
  }

  if (status === "sent") {
    return "Awaiting acknowledgement";
  }

  if (status === "queued") {
    return "Ready to process";
  }

  return "No action";
}

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
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const sentJobs = jobs.filter((job) => job.status === "sent").length;
  const queuedJobs = jobs.filter((job) => job.status === "queued").length;
  const completeJobs = jobs.filter((job) => job.status === "acknowledged").length;
  const exportBlocked = selectedPeriod?.status === "open";

  return (
    <ProviderShell
      currentSection="export"
      title="External export"
      subtitle="Deliver locked closing packages and resolve external acknowledgements."
    >
      <section className="workflow-page export-workflow">
        <article className="workflow-focus-card">
          <div>
            <p className="card-tag">Delivery focus</p>
            <h2>
              {exportBlocked
                ? "Lock a closing period first"
                : failedJobs > 0
                  ? "Resolve failed delivery"
                  : sentJobs > 0
                    ? "Confirm external acknowledgement"
                    : "Prepare package delivery"}
            </h2>
            <p>
              {exportBlocked
                ? "External delivery starts only after the operational period is locked."
                : `${selectedPeriod?.label} has ${jobs.length} delivery job${
                    jobs.length === 1 ? "" : "s"
                  }: ${queuedJobs} queued, ${sentJobs} sent, ${failedJobs} failed, ${completeJobs} acknowledged.`}
            </p>
          </div>
          <div className="workflow-focus-actions">
            {selectedPeriod ? <StatusBadge value={selectedPeriod.status} /> : null}
            {exportBlocked ? (
              <Link className="primary-link" href="/providers/closing">
                Go to closing
              </Link>
            ) : selectedPeriod ? (
              <ClosingPeriodStatusForm period={selectedPeriod} />
            ) : null}
          </div>
        </article>

        <section className="workflow-stepper" aria-label="External export workflow">
          {[
            ["1", "Select package", "Choose a locked period."],
            ["2", "Download files", "JSON or CSV handoff."],
            ["3", "Queue delivery", "Create or run sync jobs."],
            ["4", "Resolve status", "Acknowledge, retry, or reject."]
          ].map(([label, title, detail], index) => (
            <div
              className={`workflow-step-card ${
                exportBlocked
                  ? index === 0
                    ? "is-current"
                    : ""
                  : index < 2
                    ? "is-complete"
                    : failedJobs > 0 && index === 3
                      ? "is-current"
                      : sentJobs > 0 && index === 3
                        ? "is-current"
                        : queuedJobs > 0 && index === 2
                          ? "is-current"
                          : ""
              }`}
              key={title}
            >
              <span>{label}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </section>

        <section className="workflow-package-card">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Package</p>
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
                  href={`/providers/export?period=${item.id}`}
                  key={item.id}
                >
                  <span>{item.label}</span>
                  <StatusBadge value={item.status} />
                </Link>
              ))}
            </div>
          </div>

          {selectedPeriod ? (
            <>
              <div className="package-metric-grid">
                <div>
                  <span className="metric-icon metric-icon-visits" aria-hidden="true" />
                  <strong>{selectedPeriod.approvedVisitsCount}</strong>
                  <p>visits</p>
                </div>
                <div>
                  <span className="metric-icon metric-icon-today" aria-hidden="true" />
                  <strong>{selectedPeriod.approvedMinutesTotal}</strong>
                  <p>minutes</p>
                </div>
                <div>
                  <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
                  <strong>{formatCurrency(selectedPeriod.billableCentsTotal)}</strong>
                  <p>billable</p>
                </div>
                <div>
                  <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
                  <strong>{jobs.length}</strong>
                  <p>delivery jobs</p>
                </div>
              </div>
              <div className="package-action-row">
                {selectedPeriod.status !== "open" ? (
                  <>
                    <Link className="primary-link" href={`/providers/closing/export/${selectedPeriod.id}`}>
                      Download JSON
                    </Link>
                    <Link
                      className="ghost-link"
                      href={`/providers/closing/export/${selectedPeriod.id}?format=csv`}
                    >
                      Download CSV
                    </Link>
                  </>
                ) : (
                  <p className="panel-copy">Lock this period in Closing before exporting.</p>
                )}
              </div>
            </>
          ) : null}
        </section>

        {selectedPeriod ? (
          <section className="workflow-work-card">
            <div className="section-title-row">
              <div>
                <p className="card-tag">External delivery</p>
                <h2>Sync jobs</h2>
              </div>
              {selectedPeriod.status !== "open" ? (
                <div className="inline-actions">
                  <RunClosingSyncQueueForm periodId={selectedPeriod.id} />
                  <CheckClosingSyncQueueForm periodId={selectedPeriod.id} />
                </div>
              ) : null}
            </div>

            {selectedPeriod.status !== "open" ? (
              <details className="delivery-create-panel">
                <summary>
                  <span>
                    <span className="card-tag">New delivery</span>
                    <strong>Queue another external target</strong>
                  </span>
                  <span className="skill-pill">Add job</span>
                </summary>
                <ClosingSyncForm periodId={selectedPeriod.id} />
              </details>
            ) : (
              <p className="panel-copy">Open periods cannot be exported yet.</p>
            )}

            <div className="delivery-job-list">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <article className={`delivery-job-card delivery-job-${job.status}`} key={job.id}>
                    <div className="delivery-job-main">
                      <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
                      <div>
                        <div className="split-row">
                          <strong>{job.targetSystem.replaceAll("_", " ")}</strong>
                          <StatusBadge value={job.status} />
                        </div>
                        <p>{getJobActionLabel(job.status)}</p>
                        <p>
                          Attempt {job.attemptCount} / External ref:{" "}
                          {job.externalReference ?? "Pending"}
                        </p>
                        <p>{job.connectorMessage ?? job.lastError ?? "No connector message."}</p>
                      </div>
                    </div>
                    <div className="delivery-job-actions">
                      {job.status === "queued" ? <ProcessClosingSyncForm jobId={job.id} /> : null}
                      {job.status === "sent" ? (
                        <>
                          <CheckClosingSyncForm jobId={job.id} />
                          <ResolveClosingSyncForm jobId={job.id} resolution="acknowledged" />
                          <ResolveClosingSyncForm jobId={job.id} resolution="rejected" />
                        </>
                      ) : null}
                      {job.status === "failed" ? <RetryClosingSyncForm jobId={job.id} /> : null}
                    </div>
                    {job.attempts.length > 0 ? (
                      <details className="delivery-attempts">
                        <summary>Attempt history</summary>
                        <div className="compact-sequence-list top-gap">
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
                  </article>
                ))
              ) : (
                <p className="panel-copy">No sync jobs have been created for this period yet.</p>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </ProviderShell>
  );
}
