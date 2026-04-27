import Link from "next/link";
import { SessionBanner } from "@/components/auth/session-banner";
import {
  CarerAvailabilityBlockForm,
  CarerAvailabilityNoteForm,
  CarerChecklistItemForm,
  CarerCredentialForm,
  CarerEvidenceForm,
  CarerIncidentForm,
  CarerStatusActionForm
} from "@/components/carers/carer-forms";
import { StatusBadge } from "@/components/providers/status-badge";
import { type SessionUser } from "@/lib/auth";
import { CarerWorkspaceRecord } from "@/lib/carers";
import { formatDateTime } from "@/lib/providers";
import { getAllowedVisitTransitions } from "@/lib/visit-state";

function getAvailableActions(visit: CarerWorkspaceRecord["visits"][number]) {
  const allowedTransitions = getAllowedVisitTransitions(visit.status, "carer", {
    assignedCarerId: "current-carer",
    hasActualStart: Boolean(visit.actualStart),
    hasActualEnd: Boolean(visit.actualEnd)
  });

  return allowedTransitions
    .map((status) => {
      if (status === "in_progress") {
        return "start";
      }

      if (status === "completed") {
        return "complete";
      }

      if (status === "under_review") {
        return "submit_review";
      }

      return undefined;
    })
    .filter((action): action is "start" | "complete" | "submit_review" => Boolean(action));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getSignalClass(tone: string) {
  switch (tone) {
    case "positive":
      return "readiness-signal-positive";
    case "critical":
      return "readiness-signal-critical";
    case "warning":
      return "readiness-signal-warning";
    default:
      return "readiness-signal-neutral";
  }
}

function getCredentialCardClass(credential: CarerWorkspaceRecord["credentials"][number]) {
  if (credential.status === "expired" || credential.status === "rejected" || credential.expiryState === "expired") {
    return "credential-card credential-card-critical";
  }

  if (credential.status === "pending" || credential.expiryState === "expiring_soon") {
    return "credential-card credential-card-warning";
  }

  return "credential-card";
}

function getVisitActionSummary(visit?: CarerWorkspaceRecord["visits"][number]) {
  if (!visit) {
    return "No active visit selected.";
  }

  if (visit.executionReadiness.reviewBlockers.length > 0) {
    return visit.executionReadiness.reviewBlockers[0];
  }

  if (visit.status === "confirmed") {
    return "Ready to start from the execution controls.";
  }

  if (visit.status === "in_progress") {
    return "Complete the visit once field work is finished.";
  }

  if (visit.status === "completed") {
    return "Submit for review when the execution context is ready.";
  }

  if (visit.status === "under_review") {
    return "Waiting for provider review.";
  }

  return "Track this visit from the assigned visit queue.";
}

export function CarerWorkspace({
  selectedVisitId,
  session,
  workspace
}: {
  selectedVisitId?: string;
  session: SessionUser;
  workspace: CarerWorkspaceRecord;
}) {
  const selectedVisit =
    workspace.visits.find((visit) => visit.id === selectedVisitId) ?? workspace.visits[0];

  const todayVisits = workspace.visits.filter((visit) => {
    const visitDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(visit.scheduledStart));
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    return visitDate === today;
  });

  const expiringSoon = workspace.credentials.filter((credential) => credential.isExpiringSoon).length;
  const expiredCredentials = workspace.credentials.filter(
    (credential) => credential.status === "expired" || credential.expiryState === "expired"
  ).length;
  const workingBlocks = workspace.availabilityBlocks.filter((block) => block.isWorking).length;
  const unavailableBlocks = workspace.availabilityBlocks.length - workingBlocks;
  const blockerCount = workspace.readinessSummary.blockerSignals.length;
  const attentionCount = workspace.readinessSummary.attentionSignals.length;

  return (
    <main className="role-page carer-theme">
      <SessionBanner session={session} />

      <section className="carer-hero-panel">
        <span className="eyebrow">Carer execution</span>
        <div className="carer-hero-grid">
          <div>
            <h1>{workspace.carerName}</h1>
            <p>{workspace.readinessSummary.operationalImpact}</p>
          </div>
          <div className="carer-hero-status">
            <StatusBadge value={workspace.readinessStatus} />
            <strong>{selectedVisit ? selectedVisit.orderCode : "No assigned visit"}</strong>
            <span>{getVisitActionSummary(selectedVisit)}</span>
          </div>
        </div>
      </section>

      <section className="metrics-grid metrics-grid-4">
        <article className="metric-card metric-neutral">
          <p>Assigned visits</p>
          <strong>{workspace.visits.length}</strong>
          <span>Current visits assigned to this carer</span>
        </article>
        <article className="metric-card metric-positive">
          <p>Today</p>
          <strong>{todayVisits.length}</strong>
          <span>Visits scheduled for today in Australia/Sydney</span>
        </article>
        <article className="metric-card metric-warning">
          <p>Readiness</p>
          <strong>{workspace.readinessStatus.replaceAll("_", " ")}</strong>
          <span>{blockerCount} blockers - {attentionCount} attention signals</span>
        </article>
        <article className="metric-card metric-critical">
          <p>Credential alerts</p>
          <strong>{expiredCredentials + expiringSoon}</strong>
          <span>{expiredCredentials} expired · {expiringSoon} expiring in 45 days</span>
        </article>
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Agenda</p>
              <h2>Assigned visits</h2>
            </div>
            <span className="skill-pill">Execution queue</span>
          </div>
          <p className="panel-copy">{workspace.availability}</p>
          <div className="visit-list">
            {workspace.visits.length > 0 ? (
              workspace.visits.map((visit) => (
                <Link
                  className={`visit-list-item ${
                    selectedVisit?.id === visit.id ? "is-active" : ""
                  }`}
                  href={`/carers?visit=${visit.id}`}
                  key={visit.id}
                >
                  <div>
                    <strong>
                      {visit.orderCode} · {visit.label}
                    </strong>
                    <p>
                      {visit.recipientName} · {visit.serviceType}
                    </p>
                    <p>{formatDateTime(visit.scheduledStart)} - {formatDateTime(visit.scheduledEnd)}</p>
                  </div>
                  <StatusBadge value={visit.status} />
                </Link>
              ))
            ) : (
              <p className="panel-copy">No assigned visits yet for this carer.</p>
            )}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Profile readiness</p>
              <h2>{workspace.readinessSummary.headline}</h2>
            </div>
            <StatusBadge value={workspace.readinessStatus} />
          </div>
          <div className="readiness-lanes top-gap">
            <div className="readiness-lane">
              <strong>Ready signals</strong>
              {workspace.readinessSummary.positiveSignals.map((signal) => (
                <div className={`readiness-signal ${getSignalClass(signal.tone)}`} key={signal.id}>
                  <span>{signal.label}</span>
                  <p>{signal.detail}</p>
                </div>
              ))}
            </div>
            <div className="readiness-lane">
              <strong>Attention</strong>
              {workspace.readinessSummary.attentionSignals.length > 0 ? (
                workspace.readinessSummary.attentionSignals.map((signal) => (
                  <div className={`readiness-signal ${getSignalClass(signal.tone)}`} key={signal.id}>
                    <span>{signal.label}</span>
                    <p>{signal.detail}</p>
                  </div>
                ))
              ) : (
                <p className="panel-copy">No attention signals.</p>
              )}
            </div>
            <div className="readiness-lane">
              <strong>Blockers</strong>
              {workspace.readinessSummary.blockerSignals.length > 0 ? (
                workspace.readinessSummary.blockerSignals.map((signal) => (
                  <div className={`readiness-signal ${getSignalClass(signal.tone)}`} key={signal.id}>
                    <span>{signal.label}</span>
                    <p>{signal.detail}</p>
                  </div>
                ))
              ) : (
                <p className="panel-copy">No blockers.</p>
              )}
            </div>
          </div>
          <div className="readiness-mini-summary top-gap">
            <div>
              <strong>{workspace.verifiedSkills.length}</strong>
              <span>verified skills</span>
            </div>
            <div>
              <strong>{workingBlocks}</strong>
              <span>working blocks</span>
            </div>
            <div>
              <strong>{unavailableBlocks}</strong>
              <span>unavailable blocks</span>
            </div>
          </div>
        </article>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Operational alerts</p>
            <h2>Action queue</h2>
          </div>
          <span className="skill-pill">{workspace.alerts.length} alerts</span>
        </div>
        <div className="sequence-list">
          {workspace.alerts.length > 0 ? (
            workspace.alerts.map((alert) => (
              <div className={`note-block alert-block alert-${alert.tone}`} key={alert.id}>
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </div>
            ))
          ) : (
            <p className="panel-copy">No alerts right now.</p>
          )}
        </div>
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Availability</p>
              <h2>Profile and working blocks</h2>
            </div>
            <span className="skill-pill">{workingBlocks} working</span>
          </div>
          <div className="carer-form-strip">
            <CarerAvailabilityNoteForm availability={workspace.availability} />
            <CarerAvailabilityBlockForm />
          </div>
          <div className="sequence-list top-gap">
            {workspace.availabilityBlocks.length > 0 ? (
              workspace.availabilityBlocks.map((block) => (
                <div className="note-block" key={block.id}>
                  <strong>{block.isWorking ? "Working block" : "Unavailable block"}</strong>
                  <p>
                    {formatDateTime(block.startsAt)} - {formatDateTime(block.endsAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="panel-copy">No upcoming availability blocks have been recorded yet.</p>
            )}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Credentials</p>
              <h2>Operational readiness</h2>
            </div>
            <span className="skill-pill">{workspace.credentials.length} records</span>
          </div>
          <CarerCredentialForm />
          <div className="sequence-list top-gap">
            {workspace.credentials.length > 0 ? (
              workspace.credentials.map((credential) => (
                <div className={getCredentialCardClass(credential)} key={credential.id}>
                  <div className="credential-card-header">
                    <strong>{credential.name}</strong>
                    <span
                      className={`credential-pill credential-pill-${credential.status}${
                        credential.isExpiringSoon ? " is-expiring" : ""
                      }`}
                    >
                      {credential.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="credential-meta">
                    <span>Issued: {credential.issuedAt ? formatDate(credential.issuedAt) : "Not recorded"}</span>
                    <span>
                      Expires: {credential.expiresAt ? formatDate(credential.expiresAt) : "No expiry"}
                    </span>
                    <span>
                      {credential.expirySummary}
                    </span>
                  </div>
                  <div className="credential-alert-summary">
                    <strong>{credential.matchingImpact}</strong>
                    <p>{credential.renewalAction}</p>
                  </div>
                  {credential.documentUrl ? <p>{credential.documentUrl}</p> : null}
                  <CarerCredentialForm credential={credential} />
                </div>
              ))
            ) : (
              <p className="panel-copy">No credentials recorded for this carer yet.</p>
            )}
          </div>
        </article>
      </section>

      {selectedVisit ? (
        <>
          <section className="ops-overview-grid">
            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Visit detail</p>
                  <h2>
                    {selectedVisit.orderCode} · {selectedVisit.orderTitle}
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
                  <dt>Center</dt>
                  <dd>{selectedVisit.centerName}</dd>
                </div>
                <div>
                  <dt>Facility</dt>
                  <dd>{selectedVisit.facilityName}</dd>
                </div>
                <div>
                  <dt>Service type</dt>
                  <dd>{selectedVisit.serviceType}</dd>
                </div>
                <div>
                  <dt>Window</dt>
                  <dd>
                    {formatDateTime(selectedVisit.scheduledStart)} -{" "}
                    {formatDateTime(selectedVisit.scheduledEnd)}
                  </dd>
                </div>
                <div>
                  <dt>Checklist</dt>
                  <dd>{selectedVisit.checklistCompletion}% complete</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{selectedVisit.evidence.length} captured</dd>
                </div>
                <div>
                  <dt>Incidents</dt>
                  <dd>{selectedVisit.incidents.length} reported</dd>
                </div>
              </dl>
            </article>

            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Field brief</p>
                  <h2>Instructions and requirements</h2>
                </div>
              </div>
              <p className="panel-copy">{selectedVisit.instructions}</p>
              <div className="note-block">
                <strong>Current note</strong>
                <p>{selectedVisit.notes}</p>
              </div>
              <div className="pill-row">
                {selectedVisit.requiredSkills.map((skill) => (
                  <span className="skill-pill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="ops-panel">
            <div className="panel-heading">
              <div>
                <p className="card-tag">Execution control</p>
                <h2>Visit actions</h2>
              </div>
            </div>
            <div className="execution-readiness-strip">
              <div>
                <strong>{selectedVisit.executionReadiness.summary}</strong>
                <p>
                  Checklist {selectedVisit.executionReadiness.checklistComplete ? "complete" : "incomplete"} ·
                  Evidence {selectedVisit.executionReadiness.evidenceCaptured ? "captured" : "missing"} ·
                  {selectedVisit.executionReadiness.incidentCount} incidents
                </p>
              </div>
              {selectedVisit.executionReadiness.reviewBlockers.length > 0 ? (
                <div className="sequence-list">
                  {selectedVisit.executionReadiness.reviewBlockers.map((blocker) => (
                    <p className="form-warning" key={blocker}>
                      {blocker}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="inline-actions">
              {getAvailableActions(selectedVisit).map((action) => (
                <CarerStatusActionForm
                  action={action}
                  disabled={
                    action === "submit_review" &&
                    selectedVisit.executionReadiness.reviewBlockers.length > 0
                  }
                  key={action}
                  visitId={selectedVisit.id}
                />
              ))}
            </div>
          </section>

          <section className="ops-two-column">
            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Checklist</p>
                  <h2>Visit tasks</h2>
                </div>
              </div>
              <div className="sequence-list">
                {selectedVisit.checklistItems.length > 0 ? (
                  selectedVisit.checklistItems.map((item) => (
                    <CarerChecklistItemForm item={item} key={item.templateItemId} visitId={selectedVisit.id} />
                  ))
                ) : (
                  <p className="panel-copy">No checklist template is linked to this visit.</p>
                )}
              </div>
            </article>

            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Evidence</p>
                  <h2>Captured items</h2>
                </div>
              </div>
              <CarerEvidenceForm visitId={selectedVisit.id} />
              <div className="sequence-list top-gap">
                {selectedVisit.evidence.length > 0 ? (
                  selectedVisit.evidence.map((item) => (
                    <div className="note-block" key={item.id}>
                      <strong>{item.kind}</strong>
                      <p>{item.fileUrl}</p>
                      <p>
                        {item.capturedAt
                          ? formatDateTime(item.capturedAt)
                          : "Capture time not recorded"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="panel-copy">No evidence captured yet.</p>
                )}
              </div>
            </article>
          </section>

          <section className="ops-two-column">
            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Incident report</p>
                  <h2>Report an exception</h2>
                </div>
              </div>
              <CarerIncidentForm visitId={selectedVisit.id} />
            </article>

            <article className="ops-panel">
              <div className="panel-heading">
                <div>
                  <p className="card-tag">Reported incidents</p>
                  <h2>Current exceptions</h2>
                </div>
              </div>
              <div className="sequence-list">
                {selectedVisit.incidents.length > 0 ? (
                  selectedVisit.incidents.map((incident) => (
                    <div className="incident-card" key={incident.id}>
                      <strong>
                        {incident.category} · {incident.severity}
                      </strong>
                      <p>{incident.summary}</p>
                      <p>Occurred {formatDateTime(incident.occurredAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="panel-copy">No incidents reported for this visit.</p>
                )}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
