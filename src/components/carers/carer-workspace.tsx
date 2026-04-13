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

function getAvailableActions(status: CarerWorkspaceRecord["visits"][number]["status"]) {
  switch (status) {
    case "scheduled":
    case "confirmed":
      return ["start"] as const;
    case "in_progress":
      return ["complete"] as const;
    case "completed":
      return ["submit_review"] as const;
    default:
      return [] as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
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

  return (
    <main className="role-page carer-theme">
      <SessionBanner session={session} />

      <section>
        <span className="eyebrow">Carer execution</span>
        <h1>Assigned visits and field execution</h1>
        <p>
          El cuidador ya puede ejecutar visitas, mantener su perfil operativo y
          ver con claridad que esta limitando o habilitando nuevas asignaciones.
        </p>
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
          <span>Operational readiness summary for provider matching</span>
        </article>
        <article className="metric-card metric-critical">
          <p>Expiring soon</p>
          <strong>{expiringSoon}</strong>
          <span>Credentials due to expire in the next 45 days</span>
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
              <h2>Verified skills and limits</h2>
            </div>
          </div>
          <div className="stacked-statuses">
            <StatusBadge value={workspace.readinessStatus} />
          </div>
          <div className="pill-row top-gap">
            {workspace.verifiedSkills.map((credential) => (
              <span className="skill-pill" key={credential}>
                {credential}
              </span>
            ))}
          </div>
          <div className="sequence-list top-gap">
            {workspace.opportunityLimits.length > 0 ? (
              workspace.opportunityLimits.map((limit) => (
                <div className="note-block" key={limit}>
                  <strong>Current limit</strong>
                  <p>{limit}</p>
                </div>
              ))
            ) : (
              <p className="panel-copy">No current operational limits are blocking this carer.</p>
            )}
          </div>
        </article>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Operational alerts</p>
            <h2>What needs attention</h2>
          </div>
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
          </div>
          <CarerAvailabilityNoteForm availability={workspace.availability} />
          <div className="top-gap">
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
          </div>
          <CarerCredentialForm />
          <div className="sequence-list top-gap">
            {workspace.credentials.length > 0 ? (
              workspace.credentials.map((credential) => (
                <div className="credential-card" key={credential.id}>
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
                      {credential.daysToExpiry === undefined
                        ? "No expiry countdown"
                        : credential.daysToExpiry >= 0
                          ? `${credential.daysToExpiry} days remaining`
                          : `${Math.abs(credential.daysToExpiry)} days overdue`}
                    </span>
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
            <div className="inline-actions">
              {getAvailableActions(selectedVisit.status).map((action) => (
                <CarerStatusActionForm action={action} key={action} visitId={selectedVisit.id} />
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
                      <p>{formatDateTime(incident.occurredAt)}</p>
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
