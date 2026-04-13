import Link from "next/link";
import { OrderAuditTimeline } from "@/components/audit/order-audit-timeline";
import {
  CheckClosingSyncForm,
  CheckClosingSyncQueueForm,
  ClosingSyncForm,
  ClosingPeriodStatusForm,
  ProcessClosingSyncForm,
  ResolveClosingSyncForm,
  RetryClosingSyncForm,
  RunClosingSyncQueueForm,
  VisitExpenseForm,
  VisitSettlementForm
} from "@/components/providers/closing-forms";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { listClosingAuditEvents } from "@/lib/audit-data";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/providers";
import { getProviderClosingWorkspace } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

type ClosingPeriodItem = Awaited<ReturnType<typeof getProviderClosingWorkspace>>["periods"][number];

function getClosingWorkflow(period?: ClosingPeriodItem) {
  if (!period) {
    return {
      summary: "Select a closing period to continue.",
      nextAction: "Choose the period you want to reconcile and export."
    };
  }

  if (period.status === "open") {
    return {
      summary: "This period is still being reconciled.",
      nextAction:
        period.excludedVisitsCount > 0
          ? `${period.excludedVisitsCount} visit${period.excludedVisitsCount === 1 ? "" : "s"} are excluded from settlement and need an operational decision.`
          : period.unsettledVisitsCount > 0
          ? `Complete settlement for ${period.unsettledVisitsCount} approved visit${period.unsettledVisitsCount === 1 ? "" : "s"}, then lock the period.`
          : "All approved visits are settled. Lock the period to prepare the external handoff."
    };
  }

  const queuedJobs = period.exportJobs.filter((job) => job.status === "queued").length;
  const sentJobs = period.exportJobs.filter((job) => job.status === "sent").length;
  const acknowledgedJobs = period.exportJobs.filter((job) => job.status === "acknowledged").length;

  if (period.status === "locked" && queuedJobs > 0) {
    return {
      summary: "The period is ready for external handoff.",
      nextAction: `Run ${queuedJobs} queued sync job${queuedJobs === 1 ? "" : "s"} to deliver the package.`
    };
  }

  if (period.status === "locked" && sentJobs > 0) {
    return {
      summary: "The package was delivered and is awaiting remote confirmation.",
      nextAction: `Check ${sentJobs} sent job${sentJobs === 1 ? "" : "s"} or wait for the internal runner to confirm acknowledgement.`
    };
  }

  if (acknowledgedJobs > 0 && period.status !== "exported") {
    return {
      summary: "The handoff is acknowledged.",
      nextAction: "Mark the period as exported when you are ready to close it operationally."
    };
  }

  if (period.status === "exported") {
    return {
      summary: "This period already completed the operational handoff.",
      nextAction: "Use the sync history and audit trail as reference for downstream billing."
    };
  }

  return {
    summary: "The period is locked but no sync was started yet.",
    nextAction: "Queue an export job to begin the external handoff."
  };
}

export default async function ProviderClosingPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string; visit?: string }>;
}) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const workspace = await getProviderClosingWorkspace(session.organizationId);
  const { period, visit } = await searchParams;
  const selectedPeriod =
    workspace.periods.find((item) => item.id === period) ?? workspace.periods[0];
  const selectedVisit =
    selectedPeriod?.visits.find((item) => item.id === visit) ?? selectedPeriod?.visits[0];
  const exportAuditEvents = selectedPeriod
    ? await listClosingAuditEvents(selectedPeriod.id, session.organizationId)
    : [];
  const workflow = getClosingWorkflow(selectedPeriod);
  const queuedJobs = selectedPeriod?.exportJobs.filter((job) => job.status === "queued").length ?? 0;
  const sentJobs = selectedPeriod?.exportJobs.filter((job) => job.status === "sent").length ?? 0;
  const acknowledgedJobs =
    selectedPeriod?.exportJobs.filter((job) => job.status === "acknowledged").length ?? 0;

  return (
    <ProviderShell
      currentSection="closing"
      title="Operational closing"
      subtitle="A clearer workflow for settlement, export preparation and external handoff."
    >
      <section className="metrics-grid metrics-grid-4">
        <article className="metric-card metric-neutral">
          <p>Open periods</p>
          <strong>{workspace.summary.periodsOpen}</strong>
          <span>Closing windows still open for reconciliation</span>
        </article>
        <article className="metric-card metric-warning">
          <p>Ready for settlement</p>
          <strong>{workspace.summary.visitsReadyForSettlement}</strong>
          <span>Approved visits still missing settlement values</span>
        </article>
        <article className="metric-card metric-positive">
          <p>Ready for export</p>
          <strong>{workspace.summary.visitsReadyForExport}</strong>
          <span>Visits already in locked or exported periods</span>
        </article>
        <article className="metric-card metric-critical">
          <p>Approved minutes</p>
          <strong>{workspace.summary.approvedMinutesInFlight}</strong>
          <span>Total approved or suggested minutes inside visible periods</span>
        </article>
        <article className="metric-card metric-warning">
          <p>Sync jobs pending</p>
          <strong>{workspace.summary.syncJobsPending}</strong>
          <span>External handoff jobs still processing or queued</span>
        </article>
        <article className="metric-card metric-critical">
          <p>Sync jobs failed</p>
          <strong>{workspace.summary.syncJobsFailed}</strong>
          <span>Exports that need retry before the period is marked exported</span>
        </article>
        <article className="metric-card metric-warning">
          <p>Awaiting acknowledgement</p>
          <strong>{workspace.summary.syncJobsAwaitingAck}</strong>
          <span>Jobs already delivered but still waiting for external confirmation</span>
        </article>
      </section>

      {selectedPeriod ? (
        <section className="ops-panel closing-guide-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Workflow guide</p>
              <h2>What to do next</h2>
            </div>
            <StatusBadge value={selectedPeriod.status} />
          </div>
          <div className="closing-guide-copy">
            <strong>{workflow.summary}</strong>
            <p>{workflow.nextAction}</p>
          </div>
          <div className="closing-step-grid">
            <article
              className={`closing-step-card ${
                selectedPeriod.status === "open" ? "is-current" : "is-complete"
              }`}
            >
              <span>Step 1</span>
              <strong>Settle approved visits</strong>
              <p>
                {selectedPeriod.unsettledVisitsCount > 0
                  ? `${selectedPeriod.unsettledVisitsCount} visit${selectedPeriod.unsettledVisitsCount === 1 ? "" : "s"} still need approved minutes and rates.`
                  : "All approved visits inside this period are already settled."}
              </p>
            </article>
            <article
              className={`closing-step-card ${
                selectedPeriod.status === "open" && selectedPeriod.unsettledVisitsCount === 0
                  ? "is-current"
                  : selectedPeriod.status !== "open"
                    ? "is-complete"
                    : ""
              }`}
            >
              <span>Step 2</span>
              <strong>Lock the period</strong>
              <p>
                {selectedPeriod.status === "open"
                  ? "Locking freezes operational edits and unlocks the external handoff."
                  : "The period is already locked for export activity."}
              </p>
            </article>
            <article
              className={`closing-step-card ${
                selectedPeriod.status === "locked" && queuedJobs > 0
                  ? "is-current"
                  : queuedJobs === 0 && selectedPeriod.status !== "open"
                    ? "is-complete"
                    : ""
              }`}
            >
              <span>Step 3</span>
              <strong>Send the package</strong>
              <p>
                {queuedJobs > 0
                  ? `${queuedJobs} queued sync job${queuedJobs === 1 ? "" : "s"} are waiting to be processed.`
                  : "There are no queued jobs pending delivery right now."}
              </p>
            </article>
            <article
              className={`closing-step-card ${
                sentJobs > 0 ? "is-current" : acknowledgedJobs > 0 ? "is-complete" : ""
              }`}
            >
              <span>Step 4</span>
              <strong>Confirm acknowledgement</strong>
              <p>
                {sentJobs > 0
                  ? `${sentJobs} job${sentJobs === 1 ? "" : "s"} are waiting for remote confirmation.`
                  : acknowledgedJobs > 0
                    ? "At least one sync job is already acknowledged."
                    : "No acknowledgement is available yet."}
              </p>
            </article>
            <article
              className={`closing-step-card ${
                selectedPeriod.status === "exported"
                  ? "is-complete"
                  : acknowledgedJobs > 0
                    ? "is-current"
                    : ""
              }`}
            >
              <span>Step 5</span>
              <strong>Mark exported</strong>
              <p>
                {selectedPeriod.status === "exported"
                  ? "This period is already marked as handed off externally."
                  : "Once acknowledged, the period can be marked exported."}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Step 1</p>
              <h2>Select the closing period</h2>
            </div>
          </div>
          <div className="visit-list">
            {workspace.periods.map((item) => (
              <Link
                className={`visit-list-item ${selectedPeriod?.id === item.id ? "is-active" : ""}`}
                href={`/providers/closing?period=${item.id}`}
                key={item.id}
              >
                <div>
                  <strong>{item.label}</strong>
                  <p>
                    {formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}
                  </p>
                  <p>
                    {item.approvedVisitsCount} approved / {item.unsettledVisitsCount} pending / {item.excludedVisitsCount} excluded
                  </p>
                </div>
                <StatusBadge value={item.status} />
              </Link>
            ))}
          </div>
        </article>

        {selectedPeriod ? (
          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Current period</p>
                <h2>{selectedPeriod.label}</h2>
              </div>
              <StatusBadge value={selectedPeriod.status} />
            </div>
            <dl className="meta-grid">
              <div>
                <dt>Approved visits</dt>
                <dd>{selectedPeriod.approvedVisitsCount}</dd>
              </div>
              <div>
                <dt>Excluded visits</dt>
                <dd>{selectedPeriod.excludedVisitsCount}</dd>
              </div>
              <div>
                <dt>Settled visits</dt>
                <dd>{selectedPeriod.settledVisitsCount}</dd>
              </div>
              <div>
                <dt>Approved minutes</dt>
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
                <dt>Last successful sync</dt>
                <dd>
                  {selectedPeriod.latestSuccessfulExportAt
                    ? formatDateTime(selectedPeriod.latestSuccessfulExportAt)
                    : "None yet"}
                </dd>
              </div>
            </dl>
            <div className="top-gap">
              <ClosingPeriodStatusForm period={selectedPeriod} />
            </div>
            <div className="note-block top-gap">
              <strong>Period status meaning</strong>
              <p>
                {selectedPeriod.status === "open"
                  ? "Open periods still allow settlement edits and expense capture."
                  : selectedPeriod.status === "locked"
                    ? "Locked periods are ready for external export and should no longer change operationally."
                    : "Exported periods were already marked as handed off to an external system."}
              </p>
            </div>
            {selectedPeriod.excludedVisitsCount > 0 ? (
              <div className="note-block top-gap">
                <strong>Excluded from settlement</strong>
                <p>
                  {selectedPeriod.excludedVisitsCount} visit{selectedPeriod.excludedVisitsCount === 1 ? "" : "s"} in this period are outside settlement because they are not approved yet or represent an exception such as `cancelled` or `no_show`.
                </p>
              </div>
            ) : null}
            {selectedPeriod.status !== "open" ? (
              <>
                <div className="note-block top-gap">
                  <strong>Export package</strong>
                  <p>Batch id: {`serenity-${selectedPeriod.id}`}</p>
                  <div className="inline-actions top-gap">
                    <Link
                      className="primary-link"
                      href={`/providers/closing/export/${selectedPeriod.id}`}
                    >
                      Download JSON
                    </Link>
                    <Link
                      className="ghost-link"
                      href={`/providers/closing/export/${selectedPeriod.id}?format=csv`}
                    >
                      Download CSV
                    </Link>
                  </div>
                </div>
                <div className="top-gap">
                  <ClosingSyncForm periodId={selectedPeriod.id} />
                </div>
                <div className="inline-actions top-gap">
                  <RunClosingSyncQueueForm periodId={selectedPeriod.id} />
                  <CheckClosingSyncQueueForm periodId={selectedPeriod.id} />
                </div>
              </>
            ) : null}
          </article>
        ) : null}
      </section>

      {selectedPeriod ? (
        <section className="ops-two-column">
          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Step 2</p>
                <h2>Settle approved visits</h2>
              </div>
            </div>
            <div className="visit-list">
              {selectedPeriod.visits.length > 0 ? (
                selectedPeriod.visits.map((item) => (
                  <Link
                    className={`visit-list-item ${selectedVisit?.id === item.id ? "is-active" : ""}`}
                    href={`/providers/closing?period=${selectedPeriod.id}&visit=${item.id}`}
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.orderCode} / {item.recipientName}
                      </strong>
                      <p>
                        {item.carerName ?? "No carer"} / {item.serviceType}
                      </p>
                      <p>
                        {item.approvedMinutes ?? item.suggestedApprovedMinutes} approved min /{" "}
                        {formatCurrency(item.payableCents ?? 0)}
                      </p>
                    </div>
                    <StatusBadge value={item.isReadyForExport ? "locked" : item.status} />
                  </Link>
                ))
              ) : (
                <p className="panel-copy">No approved visits fall inside this closing period yet.</p>
              )}
            </div>
          </article>

          {selectedVisit ? (
            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Selected visit</p>
                  <h2>
                    {selectedVisit.orderCode} / {selectedVisit.orderTitle}
                  </h2>
                </div>
                <StatusBadge value={selectedVisit.status} />
              </div>
              <dl className="meta-grid">
                <div>
                  <dt>Recipient</dt>
                  <dd>{selectedVisit.recipientName}</dd>
                </div>
                <div>
                  <dt>Carer</dt>
                  <dd>{selectedVisit.carerName ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt>Suggested minutes</dt>
                  <dd>{selectedVisit.suggestedApprovedMinutes}</dd>
                </div>
                <div>
                  <dt>Approved minutes</dt>
                  <dd>{selectedVisit.approvedMinutes ?? "Pending"}</dd>
                </div>
                <div>
                  <dt>Billable</dt>
                  <dd>
                    {typeof selectedVisit.billableCents === "number"
                      ? formatCurrency(selectedVisit.billableCents)
                      : "Pending"}
                  </dd>
                </div>
                <div>
                  <dt>Payable</dt>
                  <dd>
                    {typeof selectedVisit.payableCents === "number"
                      ? formatCurrency(selectedVisit.payableCents)
                      : "Pending"}
                  </dd>
                </div>
              </dl>
              <div className="top-gap">
                {selectedPeriod.status === "open" ? (
                  <VisitSettlementForm periodId={selectedPeriod.id} visit={selectedVisit} />
                ) : (
                  <div className="note-block">
                    <strong>Settlement locked</strong>
                    <p>This period is no longer editable from Serenity.</p>
                  </div>
                )}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {selectedPeriod ? (
        <section className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Settlement exclusions</p>
              <h2>Visits outside this closing package</h2>
            </div>
          </div>
          <div className="sequence-list">
            {selectedPeriod.excludedVisits.length > 0 ? (
              selectedPeriod.excludedVisits.map((visit) => (
                <div className="note-block" key={visit.id}>
                  <div className="split-row">
                    <strong>
                      {visit.orderCode} / {visit.recipientName}
                    </strong>
                    <StatusBadge value={visit.status} />
                  </div>
                  <p>
                    {visit.carerName ?? "No carer"} / {visit.serviceType} /{" "}
                    {formatDateTime(visit.scheduledStart)} - {formatDateTime(visit.scheduledEnd)}
                  </p>
                  <p>{visit.exclusionReason}</p>
                  <p>Next step: {visit.nextStep}</p>
                </div>
              ))
            ) : (
              <p className="panel-copy">
                Every visit inside this period is already in an approvable state for settlement.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {selectedPeriod && selectedVisit ? (
        <section className="ops-two-column">
          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Step 3</p>
                <h2>Approved adjustments</h2>
              </div>
            </div>
            {selectedPeriod.status === "open" ? (
              <VisitExpenseForm periodId={selectedPeriod.id} visitId={selectedVisit.id} />
            ) : (
              <div className="note-block">
                <strong>Expenses locked</strong>
                <p>Open the next period or reopen operations before changing expenses.</p>
              </div>
            )}
          </article>

          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Adjustment trail</p>
                <h2>What will travel externally</h2>
              </div>
            </div>
            <div className="sequence-list">
              {selectedVisit.expenses.length > 0 ? (
                selectedVisit.expenses.map((expense) => (
                  <div className="note-block" key={expense.id}>
                    <strong>
                      {expense.type} / {formatCurrency(expense.amountCents, expense.currency)}
                    </strong>
                    <p>{expense.note ?? "No note recorded."}</p>
                    <p>{expense.evidenceUrl ?? "No evidence reference recorded."}</p>
                  </div>
                ))
              ) : (
                <p className="panel-copy">No expenses recorded for this approved visit yet.</p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {selectedPeriod ? (
        <section className="ops-two-column">
          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Step 4</p>
                <h2>Run and verify sync jobs</h2>
              </div>
            </div>
            <div className="sequence-list">
              {selectedPeriod.exportJobs.length > 0 ? (
                selectedPeriod.exportJobs.map((job) => (
                  <div className="note-block" key={job.id}>
                    <div className="split-row">
                      <strong>{job.targetSystem.replaceAll("_", " ")}</strong>
                      <StatusBadge value={job.status} />
                    </div>
                    <p>Attempts: {job.attemptCount}</p>
                    <p>Sync status: {job.status.replaceAll("_", " ")}</p>
                    <p>Batch: {job.exportBatchId ?? `serenity-${selectedPeriod.id}`}</p>
                    <p>
                      External ref: {job.externalReference ?? "Pending external acknowledgement"}
                    </p>
                    <p>Queued: {formatDateTime(job.queuedAt)}</p>
                    <p>
                      Next scheduled attempt:{" "}
                      {job.nextAttemptAt
                        ? formatDateTime(job.nextAttemptAt)
                        : "No automatic follow-up scheduled."}
                    </p>
                    <p>
                      Last attempt:{" "}
                      {job.lastAttemptAt ? formatDateTime(job.lastAttemptAt) : "Not attempted yet"}
                    </p>
                    <p>
                      {job.acknowledgedAt
                        ? `Acknowledged at ${formatDateTime(job.acknowledgedAt)}`
                        : "No acknowledgement timestamp yet."}
                    </p>
                    <p>{job.connectorMessage ?? job.lastError ?? "No connector message recorded."}</p>
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
                      <div className="sequence-list top-gap">
                        {job.attempts.slice(0, 3).map((attempt) => (
                          <div className="note-block" key={attempt.id}>
                            <strong>
                              {attempt.kind.replaceAll("_", " ")} /{" "}
                              {attempt.result.replaceAll("_", " ")}
                            </strong>
                            <p>
                              {formatDateTime(attempt.startedAt)} -{" "}
                              {formatDateTime(attempt.completedAt)}
                            </p>
                            <p>
                              {attempt.connectorMessage ??
                                attempt.errorMessage ??
                                "No attempt message recorded."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="panel-copy">
                  No external sync jobs yet. Lock the period first, then run a sync job.
                </p>
              )}
            </div>
          </article>

          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Step 5</p>
                <h2>Export decision guide</h2>
              </div>
            </div>
            <div className="sequence-list">
              <div className="note-block">
                <strong>What Serenity is doing now</strong>
                <p>
                  Serenity can queue a job, process delivery, capture connector feedback and let an
                  internal runner pick up scheduled jobs without managing payroll directly.
                </p>
              </div>
              <div className="note-block">
                <strong>Xero acknowledgement rule</strong>
                <p>
                  For `xero_custom_connection`, Serenity treats a successful `2xx` response plus an
                  external reference as an immediate acknowledgement.
                </p>
              </div>
              <div className="note-block">
                <strong>What stays outside Serenity</strong>
                <p>
                  Payment execution, tax logic, superannuation and bank transfer remain in the
                  external finance platform.
                </p>
              </div>
              <div className="note-block">
                <strong>When to mark exported</strong>
                <p>
                  A period can only move to exported after at least one acknowledged external sync.
                </p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {selectedPeriod ? <OrderAuditTimeline events={exportAuditEvents} /> : null}
    </ProviderShell>
  );
}
