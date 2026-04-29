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

function getClosingStep(period?: ClosingPeriodItem) {
  if (!period) {
    return 0;
  }

  if (period.status !== "open") {
    return 4;
  }

  if (period.unsettledVisitsCount > 0) {
    return 2;
  }

  if (period.excludedVisitsCount > 0) {
    return 3;
  }

  return 4;
}

function getClosingFocus(period?: ClosingPeriodItem) {
  if (!period) {
    return {
      action: "Choose a period",
      copy: "Start by selecting a closing period.",
      title: "Select the period to close"
    };
  }

  if (period.status !== "open") {
    return {
      action: "Go to external export",
      copy: "The operational values are locked. Delivery now happens in External export.",
      title: `${period.label} is locked`
    };
  }

  if (period.unsettledVisitsCount > 0) {
    return {
      action: "Settle visit values",
      copy: `${period.unsettledVisitsCount} approved visit${
        period.unsettledVisitsCount === 1 ? "" : "s"
      } still need final minutes and amounts.`,
      title: "Finish settlement before locking"
    };
  }

  return {
    action: "Lock period",
    copy: "All approved visits have settlement values. Lock the period when exceptions look correct.",
    title: "Ready for operational lock"
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
  const selectedVisitExpenses = selectedVisit?.expenses ?? [];
  const focus = getClosingFocus(selectedPeriod);
  const currentStep = getClosingStep(selectedPeriod);

  const steps = [
    { label: "1", title: "Select period", detail: "Choose the closing window." },
    { label: "2", title: "Settle visits", detail: "Confirm minutes and values." },
    { label: "3", title: "Review exceptions", detail: "Check expenses and exclusions." },
    { label: "4", title: "Lock for export", detail: "Freeze operational values." }
  ];

  return (
    <ProviderShell
      currentSection="closing"
      title="Operational closing"
      subtitle="Turn approved visits into a locked operational package ready for external delivery."
    >
      <section className="workflow-page">
        <article className="workflow-focus-card">
          <div>
            <p className="card-tag">Next step</p>
            <h2>{focus.title}</h2>
            <p>{focus.copy}</p>
          </div>
          <div className="workflow-focus-actions">
            {selectedPeriod ? <StatusBadge value={selectedPeriod.status} /> : null}
            {selectedPeriod?.status === "open" ? (
              <ClosingPeriodStatusForm period={selectedPeriod} />
            ) : selectedPeriod ? (
              <Link className="primary-link" href={`/providers/export?period=${selectedPeriod.id}`}>
                {focus.action}
              </Link>
            ) : null}
          </div>
        </article>

        <section className="workflow-stepper" aria-label="Closing workflow">
          {steps.map((step, index) => (
            <div
              className={`workflow-step-card ${
                currentStep === index + 1 ? "is-current" : currentStep > index + 1 ? "is-complete" : ""
              }`}
              key={step.title}
            >
              <span>{step.label}</span>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          ))}
        </section>

        <section className="workflow-package-card">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Closing package</p>
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
                  href={`/providers/closing?period=${item.id}`}
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
                <strong>{selectedPeriod.approvedVisitsCount}</strong>
                <p>approved visits</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
                <strong>{selectedPeriod.unsettledVisitsCount}</strong>
                <p>need settlement</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-today" aria-hidden="true" />
                <strong>{selectedPeriod.approvedMinutesTotal}</strong>
                <p>approved minutes</p>
              </div>
              <div>
                <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
                <strong>{formatCurrency(selectedPeriod.billableCentsTotal)}</strong>
                <p>billable</p>
              </div>
            </div>
          ) : null}
        </section>

        {selectedPeriod ? (
          <section className="workflow-work-card" id="settlement-work">
            <div className="section-title-row">
              <div>
                <p className="card-tag">Settlement</p>
                <h2>Approved visits</h2>
              </div>
              <span className="skill-pill">{selectedPeriod.visits.length} visits</span>
            </div>

            <div className="settlement-board">
              <div className="settlement-visit-rail">
                {selectedPeriod.visits.length > 0 ? (
                  selectedPeriod.visits.map((item) => (
                    <Link
                      className={`settlement-visit-card ${selectedVisit?.id === item.id ? "is-active" : ""}`}
                      href={`/providers/closing?period=${selectedPeriod.id}&visit=${item.id}`}
                      key={item.id}
                    >
                      <div>
                        <strong>
                          {item.orderCode} / {item.recipientName}
                        </strong>
                        <p>{item.carerName ?? "No carer"} / {item.serviceType}</p>
                      </div>
                      <div>
                        <span>{item.approvedMinutes ?? item.suggestedApprovedMinutes} min</span>
                        <StatusBadge value={item.isReadyForExport ? "locked" : item.status} />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="panel-copy">No approved visits fall inside this period yet.</p>
                )}
              </div>

              <article className="settlement-detail-card">
                {selectedVisit ? (
                  <>
                    <div className="split-row">
                      <div>
                        <p className="card-tag">Selected visit</p>
                        <h3>{selectedVisit.recipientName}</h3>
                        <p className="panel-copy">{selectedVisit.orderCode} / {selectedVisit.orderTitle}</p>
                      </div>
                      <StatusBadge value={selectedVisit.status} />
                    </div>
                    <div className="settlement-value-grid">
                      <div>
                        <span>Carer</span>
                        <strong>{selectedVisit.carerName ?? "Unassigned"}</strong>
                      </div>
                      <div>
                        <span>Approved minutes</span>
                        <strong>{selectedVisit.approvedMinutes ?? "Pending"}</strong>
                      </div>
                      <div>
                        <span>Billable</span>
                        <strong>
                          {typeof selectedVisit.billableCents === "number"
                            ? formatCurrency(selectedVisit.billableCents)
                            : "Pending"}
                        </strong>
                      </div>
                      <div>
                        <span>Payable</span>
                        <strong>
                          {typeof selectedVisit.payableCents === "number"
                            ? formatCurrency(selectedVisit.payableCents)
                            : "Pending"}
                        </strong>
                      </div>
                    </div>
                    {selectedPeriod.status === "open" ? (
                      <VisitSettlementForm periodId={selectedPeriod.id} visit={selectedVisit} />
                    ) : (
                      <div className="note-block top-gap">
                        <strong>Settlement locked</strong>
                        <p>This period is no longer editable from Serenity.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="panel-copy">Choose a visit to review settlement values.</p>
                )}
              </article>
            </div>
          </section>
        ) : null}

        {selectedPeriod ? (
          <details className="workflow-work-card workflow-disclosure" id="exceptions-work">
            <summary>
              <span>
                <span className="card-tag">Exceptions</span>
                <strong>Expenses and excluded visits</strong>
              </span>
              <span className="skill-pill">
                {selectedVisitExpenses.length + selectedPeriod.excludedVisits.length} items
              </span>
            </summary>
            <div className="exception-grid">
              <article>
                <h3>Expenses</h3>
                {selectedVisit && selectedPeriod.status === "open" ? (
                  <VisitExpenseForm periodId={selectedPeriod.id} visitId={selectedVisit.id} />
                ) : (
                  <p className="panel-copy">Expenses are read-only when the period is locked.</p>
                )}
                <div className="compact-sequence-list top-gap">
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
                <div className="compact-sequence-list">
                  {selectedPeriod.excludedVisits.length > 0 ? (
                    selectedPeriod.excludedVisits.map((excludedVisit) => (
                      <div className="note-block compact-note-block" key={excludedVisit.id}>
                        <strong>
                          {excludedVisit.orderCode} / {excludedVisit.recipientName}
                        </strong>
                        <p>{excludedVisit.exclusionReason}</p>
                        <p>Next step: {excludedVisit.nextStep}</p>
                      </div>
                    ))
                  ) : (
                    <p className="panel-copy">No visits are excluded from this period.</p>
                  )}
                </div>
              </article>
            </div>
          </details>
        ) : null}
      </section>
    </ProviderShell>
  );
}
