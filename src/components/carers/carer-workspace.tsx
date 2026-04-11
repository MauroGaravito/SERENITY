import Link from "next/link";
import { SessionBanner } from "@/components/auth/session-banner";
import {
  CarerChecklistItemForm,
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

  return (
    <main className="role-page carer-theme">
      <SessionBanner session={session} />

      <section>
        <span className="eyebrow">Carer execution</span>
        <h1>Assigned visits and field execution</h1>
        <p>
          La vista del cuidador ahora permite seguir visitas asignadas, completar
          checklist, registrar evidencia y reportar incidencias basicas.
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
          <p>Evidence items</p>
          <strong>
            {workspace.visits.reduce((count, visit) => count + visit.evidence.length, 0)}
          </strong>
          <span>Captured evidence across assigned visits</span>
        </article>
        <article className="metric-card metric-critical">
          <p>Incidents</p>
          <strong>
            {workspace.visits.reduce((count, visit) => count + visit.incidents.length, 0)}
          </strong>
          <span>Exceptions reported from field execution</span>
        </article>
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Agenda</p>
              <h2>Assigned visits</h2>
            </div>
            <span className="skill-pill">{workspace.availability}</span>
          </div>
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
              <h2>Verified skills</h2>
            </div>
          </div>
          <div className="pill-row">
            {workspace.credentials.map((credential) => (
              <span className="skill-pill" key={credential}>
                {credential}
              </span>
            ))}
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
