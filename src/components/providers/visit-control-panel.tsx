"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignCarerToVisit,
  logOperationalEscalation,
  requestVisitReplacement,
  reviewVisit,
  updateVisitStatus
} from "@/app/providers/actions";
import {
  CarerOption,
  ReviewOutcome,
  ServiceOrderRecord,
  VisitRecord,
  VisitStatus,
  formatDateTime
} from "@/lib/providers";
import { StatusBadge } from "@/components/providers/status-badge";

type VisitControlPanelProps = {
  canReviewVisits: boolean;
  order: ServiceOrderRecord;
};

function getSuggestedAction(visit: VisitRecord) {
  if (!visit.assignedCarerId) {
    return "Assign a carer before the coverage window closes.";
  }

  if (visit.status === "scheduled") {
    return "Confirm the visit once the carer accepts the shift.";
  }

  if (visit.status === "completed") {
    return "Push the visit into review to unblock approval.";
  }

  if (visit.status === "under_review") {
    return "Review evidence and approve or reject the visit.";
  }

  return "Track execution and keep the visit moving toward closure.";
}

export function VisitControlPanel({
  canReviewVisits,
  order
}: VisitControlPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState(order.visits[0]?.id ?? "");
  const [escalationSeverity, setEscalationSeverity] = useState("high");
  const [escalationReason, setEscalationReason] = useState("");

  const selectedVisit = useMemo(
    () => order.visits.find((visit) => visit.id === selectedVisitId) ?? order.visits[0],
    [order.visits, selectedVisitId]
  );
  const eligibleCarers = useMemo(
    () => order.eligibleCarers.filter((carer) => carer.isEligible),
    [order.eligibleCarers]
  );
  const restrictedCarers = useMemo(
    () => order.eligibleCarers.filter((carer) => !carer.isEligible),
    [order.eligibleCarers]
  );

  if (!selectedVisit) {
    return null;
  }

  function runMutation(task: () => Promise<void>) {
    startTransition(async () => {
      try {
        setError(null);
        await task();
        router.refresh();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Unable to update visit right now."
        );
      }
    });
  }

  function handleAssignCarer(carer: CarerOption) {
    runMutation(() =>
      assignCarerToVisit({
        visitId: selectedVisit.id,
        carerId: carer.id,
        path: `/providers/orders/${order.id}`
      })
    );
  }

  function handleAdvanceStatus(nextStatus: VisitStatus) {
    runMutation(() =>
      updateVisitStatus({
        visitId: selectedVisit.id,
        status: nextStatus,
        path: `/providers/orders/${order.id}`
      })
    );
  }

  function handleReplacementRequest() {
    runMutation(() =>
      requestVisitReplacement({
        visitId: selectedVisit.id,
        path: `/providers/orders/${order.id}`,
        reason: "Replacement coverage required after operational exception."
      })
    );
  }

  function handleEscalation() {
    if (!escalationReason.trim()) {
      setError("Add a reason before logging the escalation.");
      return;
    }

    const formData = new FormData();
    formData.append("orderId", order.id);
    formData.append("severity", escalationSeverity);
    formData.append("reason", escalationReason);
    formData.append("path", `/providers/orders/${order.id}`);

    runMutation(() => logOperationalEscalation(formData));
  }

  function handleReview(outcome: ReviewOutcome) {
    runMutation(() =>
      reviewVisit({
        visitId: selectedVisit.id,
        outcome,
        path: `/providers/orders/${order.id}`
      })
    );
  }

  return (
    <section className="ops-detail-grid">
      <div className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Visits in this order</p>
            <h2>{order.code}</h2>
          </div>
          <StatusBadge value={order.status} />
        </div>
        <div className="visit-list">
          {order.visits.map((visit) => (
            <button
              className={`visit-list-item ${
                visit.id === selectedVisit.id ? "is-active" : ""
              }`}
              disabled={isPending}
              key={visit.id}
              onClick={() => setSelectedVisitId(visit.id)}
              type="button"
            >
              <div>
                <strong>{visit.label}</strong>
                <p>{visit.assignedCarerName ?? "Unassigned visit"}</p>
              </div>
              <StatusBadge value={visit.status} />
            </button>
          ))}
        </div>
      </div>

      <div className="ops-stack">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Visit control</p>
              <h2>{selectedVisit.label}</h2>
            </div>
            <StatusBadge value={selectedVisit.status} />
          </div>
          <dl className="meta-grid">
            <div>
              <dt>Window</dt>
              <dd>
                {formatDateTime(selectedVisit.scheduledStart)} - {" "}
                {formatDateTime(selectedVisit.scheduledEnd)}
              </dd>
            </div>
            <div>
              <dt>Checklist</dt>
              <dd>{selectedVisit.checklistCompletion}% complete</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{selectedVisit.evidenceCount} files</dd>
            </div>
            <div>
              <dt>Suggested action</dt>
              <dd>{getSuggestedAction(selectedVisit)}</dd>
            </div>
          </dl>

          {error ? <p className="error-copy">{error}</p> : null}
          {isPending ? <p className="pending-copy">Saving operational change...</p> : null}

          <div className="action-grid">
            <div className="action-card">
              <h3>Assign carer</h3>
              <div className="stacked-options">
                {eligibleCarers.length > 0 ? eligibleCarers.map((carer) => (
                  <button
                    className="mini-action"
                    disabled={isPending}
                    key={carer.id}
                    onClick={() => handleAssignCarer(carer)}
                    type="button"
                  >
                    <span>{carer.name}</span>
                    <small>
                      {carer.availability} · {carer.rating.toFixed(1)}
                    </small>
                  </button>
                )) : <p className="panel-copy">No carer currently clears the matching rules.</p>}
              </div>
            </div>

            <div className="action-card">
              <h3>Visit status</h3>
              <div className="inline-actions">
                {([
                  "confirmed",
                  "in_progress",
                  "completed",
                  "under_review",
                  "cancelled",
                  "no_show"
                ] as const).map(
                  (status) => (
                    <button
                      className="mini-action"
                      disabled={isPending}
                      key={status}
                      onClick={() => handleAdvanceStatus(status)}
                      type="button"
                    >
                      {status}
                    </button>
                  )
                )}
                <button
                  className="mini-action reject"
                  disabled={isPending}
                  onClick={handleReplacementRequest}
                  type="button"
                >
                  Request replacement
                </button>
              </div>
            </div>

            {canReviewVisits ? (
              <div className="action-card">
                <h3>Review outcome</h3>
                <div className="inline-actions">
                  <button
                    className="mini-action approve"
                    disabled={isPending}
                    onClick={() => handleReview("approved")}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="mini-action reject"
                    disabled={isPending}
                    onClick={() => handleReview("rejected")}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Execution notes</p>
              <h2>{selectedVisit.assignedCarerName ?? "No carer assigned"}</h2>
            </div>
          </div>
          <p className="panel-copy">{selectedVisit.notes}</p>
          {selectedVisit.incident ? (
            <div className="incident-card">
              <strong>
                {selectedVisit.incident.category} · {selectedVisit.incident.severity}
              </strong>
              <p>{selectedVisit.incident.summary}</p>
            </div>
          ) : null}
          {selectedVisit.review ? (
            <div className="review-card">
              <StatusBadge value={selectedVisit.review.outcome} />
              <p>
                {selectedVisit.review.reviewer} · {formatDateTime(selectedVisit.review.at)}
              </p>
              <p>{selectedVisit.review.note}</p>
            </div>
          ) : (
            <p className="panel-copy">
              No review captured yet. This visit is still on the operational lane.
            </p>
          )}
          {restrictedCarers.length > 0 ? (
            <div className="top-gap">
              <strong>Restricted carers</strong>
              <div className="sequence-list top-gap">
                {restrictedCarers.map((carer) => (
                  <div className="note-block" key={carer.id}>
                    <strong>{carer.name}</strong>
                    <p>{carer.eligibilityReasons.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="top-gap escalation-panel">
            <strong>Operational escalation</strong>
            <p>Use this when coverage risk or service impact needs an explicit coordination note.</p>
            <div className="form-grid top-gap">
              <label>
                <span>Severity</span>
                <select
                  disabled={isPending}
                  onChange={(event) => setEscalationSeverity(event.target.value)}
                  value={escalationSeverity}
                >
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="form-grid-span-2">
                <span>Reason</span>
                <input
                  disabled={isPending}
                  onChange={(event) => setEscalationReason(event.target.value)}
                  placeholder="Describe why this order needs escalation"
                  type="text"
                  value={escalationReason}
                />
              </label>
            </div>
            <div className="top-gap">
              <button
                className="primary-link"
                disabled={isPending}
                onClick={handleEscalation}
                type="button"
              >
                Log escalation
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
