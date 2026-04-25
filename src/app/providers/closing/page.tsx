import Link from "next/link";
import {
  ClosingPeriodStatusForm,
  VisitExpenseForm,
  VisitSettlementForm
} from "@/components/providers/closing-forms";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/providers";
import { getProviderClosingWorkspace } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

type ClosingPeriodItem = Awaited<ReturnType<typeof getProviderClosingWorkspace>>["periods"][number];

function getClosingMission(period?: ClosingPeriodItem) {
  if (!period) {
    return {
      title: "Select a period",
      copy: "Choose a closing period to review approved visits and settlement values."
    };
  }

  if (period.status !== "open") {
    return {
      title: "Period locked",
      copy: "This period is no longer editable here. Use External export to manage delivery."
    };
  }

  if (period.unsettledVisitsCount > 0) {
    return {
      title: "Settle approved visits",
      copy: `${period.unsettledVisitsCount} approved visit${period.unsettledVisitsCount === 1 ? "" : "s"} still need final minutes and rates.`
    };
  }

  return {
    title: "Ready to lock",
    copy: "All approved visits are settled. Lock the period when the operational values are final."
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
  const mission = getClosingMission(selectedPeriod);
  const selectedVisitExpenses = selectedVisit?.expenses ?? [];
  const lockedPeriods = workspace.periods.filter((item) => item.status !== "open").length;

  return (
    <ProviderShell
      currentSection="closing"
      title="Operational closing"
      subtitle="Review approved visits, settle values and lock periods for export."
    >
      <section className="closing-cockpit">
        <article className="closing-mission-panel">
          <div>
            <p className="card-tag">Closing mission</p>
            <h2>{mission.title}</h2>
            <p className="panel-copy">{mission.copy}</p>
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
            <p>Periods still editable.</p>
          </Link>
          <a className="summary-stat-card summary-stat-card-warning" href="#settlement-work">
            <span>Need settlement</span>
            <strong>{workspace.summary.visitsReadyForSettlement}</strong>
            <p>Approved visits missing final values.</p>
          </a>
          <a className="summary-stat-card summary-stat-card-critical" href="#exceptions-work">
            <span>Excluded visits</span>
            <strong>{selectedPeriod?.excludedVisitsCount ?? 0}</strong>
            <p>Visits outside this closing package.</p>
          </a>
          <Link className="summary-stat-card summary-stat-card-positive" href="/providers/export">
            <span>Locked periods</span>
            <strong>{lockedPeriods}</strong>
            <p>Periods ready for external export.</p>
          </Link>
        </section>
      </section>

      <section className="closing-workbench" id="settlement-work">
        <article className="ops-panel closing-period-selector">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Period</p>
              <h2>Select period</h2>
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
                    {item.approvedVisitsCount} approved / {item.unsettledVisitsCount} pending /{" "}
                    {item.excludedVisitsCount} excluded
                  </p>
                </div>
                <StatusBadge value={item.status} />
              </Link>
            ))}
          </div>
        </article>

        {selectedPeriod ? (
          <article className="ops-panel closing-period-overview">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Current period</p>
                <h2>{selectedPeriod.label}</h2>
                <p className="panel-copy">
                  {formatDateTime(selectedPeriod.startsAt)} - {formatDateTime(selectedPeriod.endsAt)}
                </p>
              </div>
              <StatusBadge value={selectedPeriod.status} />
            </div>
            <dl className="meta-grid closing-meta-grid">
              <div>
                <dt>Approved visits</dt>
                <dd>{selectedPeriod.approvedVisitsCount}</dd>
              </div>
              <div>
                <dt>Settled visits</dt>
                <dd>{selectedPeriod.settledVisitsCount}</dd>
              </div>
              <div>
                <dt>Excluded visits</dt>
                <dd>{selectedPeriod.excludedVisitsCount}</dd>
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
            </dl>
          </article>
        ) : null}
      </section>

      {selectedPeriod ? (
        <section className="closing-workbench closing-workbench-main">
          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Approved visits</p>
                <h2>Settle visits</h2>
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
                        {item.approvedMinutes ?? item.suggestedApprovedMinutes} min /{" "}
                        {formatCurrency(item.payableCents ?? 0)}
                      </p>
                    </div>
                    <StatusBadge value={item.isReadyForExport ? "locked" : item.status} />
                  </Link>
                ))
              ) : (
                <p className="panel-copy">No approved visits fall inside this period yet.</p>
              )}
            </div>
          </article>

          <article className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Selected visit</p>
                <h2>Settlement values</h2>
              </div>
            </div>
            {selectedVisit ? (
              <>
                <div className="split-row">
                  <strong>
                    {selectedVisit.orderCode} / {selectedVisit.orderTitle}
                  </strong>
                  <StatusBadge value={selectedVisit.status} />
                </div>
                <dl className="meta-grid top-gap">
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
              </>
            ) : (
              <p className="panel-copy">Choose a visit to review settlement values.</p>
            )}
          </article>
        </section>
      ) : null}

      {selectedPeriod ? (
        <details className="ops-panel closing-detail-panel" id="exceptions-work">
          <summary>
            <span>
              <span className="card-tag">Exceptions and adjustments</span>
              <strong>Expenses and excluded visits</strong>
            </span>
            <span className="skill-pill">
              {selectedVisitExpenses.length + selectedPeriod.excludedVisits.length} items
            </span>
          </summary>
          <div className="closing-detail-content closing-detail-grid">
            <article>
              <h3>Expenses and travel</h3>
              {selectedVisit && selectedPeriod.status === "open" ? (
                <VisitExpenseForm periodId={selectedPeriod.id} visitId={selectedVisit.id} />
              ) : (
                <div className="note-block">
                  <strong>Expenses locked</strong>
                  <p>Open periods allow expense capture; locked periods are read-only.</p>
                </div>
              )}
              <div className="sequence-list compact-sequence-list top-gap">
                {selectedVisitExpenses.length > 0 ? (
                  selectedVisitExpenses.map((expense) => (
                    <div className="note-block compact-note-block" key={expense.id}>
                      <strong>
                        {expense.type} / {formatCurrency(expense.amountCents, expense.currency)}
                      </strong>
                      <p>{expense.note ?? "No note recorded."}</p>
                    </div>
                  ))
                ) : (
                  <p className="panel-copy">No expenses recorded for this visit.</p>
                )}
              </div>
            </article>

            <article>
              <h3>Excluded visits</h3>
              <div className="sequence-list compact-sequence-list">
                {selectedPeriod.excludedVisits.length > 0 ? (
                  selectedPeriod.excludedVisits.map((excludedVisit) => (
                    <div className="note-block compact-note-block" key={excludedVisit.id}>
                      <div className="split-row">
                        <strong>
                          {excludedVisit.orderCode} / {excludedVisit.recipientName}
                        </strong>
                        <StatusBadge value={excludedVisit.status} />
                      </div>
                      <p>{excludedVisit.exclusionReason}</p>
                      <p>Next step: {excludedVisit.nextStep}</p>
                    </div>
                  ))
                ) : (
                  <p className="panel-copy">No visits are excluded from this period.</p>
                )}
              </div>
            </article>

            <article>
              <h3>Closing rules</h3>
              <div className="sequence-list compact-sequence-list">
                <div className="note-block compact-note-block">
                  <strong>Open means editable</strong>
                  <p>Settlement values and expenses can still be updated.</p>
                </div>
                <div className="note-block compact-note-block">
                  <strong>Locked means ready for export</strong>
                  <p>Operational values should no longer change after locking.</p>
                </div>
                <div className="note-block compact-note-block">
                  <strong>Export happens elsewhere</strong>
                  <p>Use External export for packages, sync jobs and acknowledgements.</p>
                </div>
              </div>
            </article>
          </div>
        </details>
      ) : null}
    </ProviderShell>
  );
}
