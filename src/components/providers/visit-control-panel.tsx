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
import { getAllowedVisitTransitions } from "@/lib/visit-state";
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

function getExecutionNarrative(visit: VisitRecord) {
  if (visit.status === "under_review") {
    return "Review the care tasks, evidence, and notes before approving this visit.";
  }

  if (visit.status === "approved") {
    return "This visit was approved and is ready for closing.";
  }

  if (visit.status === "rejected") {
    return "This visit needs correction before it can be approved.";
  }

  if (visit.checklistCompletion === 100 && visit.evidenceCount > 0) {
    return "Care tasks and evidence are ready for provider review.";
  }

  return "The carer is still building this visit record.";
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
  const providerStatusActions = useMemo(
    () =>
      getAllowedVisitTransitions(selectedVisit?.status ?? "scheduled", "provider", {
        assignedCarerId: selectedVisit?.assignedCarerId,
        hasActualStart: Boolean(selectedVisit?.actualStart),
        hasActualEnd: Boolean(selectedVisit?.actualEnd)
      }),
    [selectedVisit]
  );
  const reviewerStatusActions = useMemo(
    () =>
      getAllowedVisitTransitions(selectedVisit?.status ?? "scheduled", "reviewer", {
        assignedCarerId: selectedVisit?.assignedCarerId,
        hasActualStart: Boolean(selectedVisit?.actualStart),
        hasActualEnd: Boolean(selectedVisit?.actualEnd)
      }),
    [selectedVisit]
  );
  if (!selectedVisit) {
    return null;
  }

  const reviewContextReady =
    selectedVisit.checklistCompletion === 100 && selectedVisit.evidenceCount > 0;

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
            <p className="card-tag">Agenda</p>
            <h2>Service visits</h2>
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
              <p className="card-tag">Selected visit</p>
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
              <dt>Incidents</dt>
              <dd>{selectedVisit.incidents.length} reported</dd>
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
              <h3>Coverage match</h3>
              <div className="stacked-options">
                {selectedVisit.assignedCarerName ? (
                  <div className="note-block">
                    <strong>{selectedVisit.assignedCarerName}</strong>
                    <p>Assigned to this visit window.</p>
                  </div>
                ) : eligibleCarers.length > 0 ? eligibleCarers.map((carer) => (
                  <button
                    className="mini-action"
                    disabled={isPending}
                    key={carer.id}
                    onClick={() => handleAssignCarer(carer)}
                    type="button"
                  >
                    <span>{carer.name}</span>
                    <small>
                      {carer.availabilitySummary} · {carer.readinessSummary} · rating {carer.rating.toFixed(1)}
                    </small>
                  </button>
                )) : <p className="panel-copy">No available match is ready for this visit window.</p>}
              </div>
            </div>

            <div className="action-card">
              <h3>Next step</h3>
              <div className="inline-actions">
                {providerStatusActions.length > 0 ? providerStatusActions.map(
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
                ) : <p className="panel-copy">This visit has no provider action available right now.</p>}
                <button
                  className="mini-action reject"
                  disabled={
                    isPending ||
                    ["in_progress", "completed", "under_review", "approved", "rejected"].includes(selectedVisit.status)
                  }
                  onClick={handleReplacementRequest}
                  type="button"
                >
                  Request new coverage
                </button>
              </div>
              <p className="field-help">
                This removes the current assignment, keeps the visit scheduled, and marks it
                for replacement coverage.
              </p>
            </div>

            {canReviewVisits ? (
              <div className="action-card">
                <h3>Review outcome</h3>
                <div className="inline-actions">
                  <button
                    className="mini-action approve"
                    disabled={
                      isPending ||
                      !reviewerStatusActions.includes("approved") ||
                      !reviewContextReady
                    }
                    onClick={() => handleReview("approved")}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="mini-action reject"
                    disabled={isPending || !reviewerStatusActions.includes("rejected")}
                    onClick={() => handleReview("rejected")}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
                {!reviewContextReady ? (
                  <p className="form-warning">
                    Approval needs complete checklist and at least one evidence item.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Care record</p>
              <h2>{selectedVisit.assignedCarerName ?? "No carer assigned"}</h2>
            </div>
          </div>
          <div className="execution-readiness-strip">
            <div>
              <strong>{getExecutionNarrative(selectedVisit)}</strong>
              <p>
                Checklist {selectedVisit.checklistCompletion}% · Evidence {selectedVisit.evidenceCount} ·
                Incidents {selectedVisit.incidents.length}
              </p>
            </div>
          </div>
          <p className="panel-copy">{selectedVisit.notes}</p>
          <div className="execution-story-grid">
            <div className="note-block">
              <strong>Care tasks</strong>
              {selectedVisit.checklistItems.length > 0 ? (
                <div className="compact-sequence-list top-gap">
                  {selectedVisit.checklistItems.map((item) => (
                    <p key={item.label}>
                      {item.label}: {item.result.replaceAll("_", " ")}
                      {item.note ? ` · ${item.note}` : ""}
                    </p>
                  ))}
                </div>
              ) : (
                <p>No checklist template is linked to this visit.</p>
              )}
            </div>
            <div className="note-block">
              <strong>Evidence captured</strong>
              {selectedVisit.evidence.length > 0 ? (
                <div className="compact-sequence-list top-gap">
                  {selectedVisit.evidence.map((item) => (
                    <p key={item.id}>
                      {item.kind}: {item.fileUrl}
                      {item.capturedAt ? ` · ${formatDateTime(item.capturedAt)}` : ""}
                    </p>
                  ))}
                </div>
              ) : (
                <p>No evidence captured yet.</p>
              )}
            </div>
          </div>
          {selectedVisit.incidents.length > 0 ? (
            <div className="sequence-list top-gap">
              {selectedVisit.incidents.map((incident) => (
                <div className="incident-card" key={incident.id}>
                  <strong>
                    {incident.category} · {incident.severity}
                  </strong>
                  <p>{incident.summary}</p>
                  <p>
                    Occurred {formatDateTime(incident.occurredAt)}
                    {incident.resolvedAt ? ` · Resolved ${formatDateTime(incident.resolvedAt)}` : " · Open"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-copy">No incidents reported for this visit.</p>
          )}
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
          <div className="top-gap escalation-panel">
            <strong>Care coordination note</strong>
            <p>Record a provider note when this visit needs follow-up.</p>
            <div className="form-grid top-gap">
              <label>
                <span>Priority</span>
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
                  placeholder="Describe the follow-up needed"
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
                Save note
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
