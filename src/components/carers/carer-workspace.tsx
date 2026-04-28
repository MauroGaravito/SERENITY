import Link from "next/link";
import { SessionBanner } from "@/components/auth/session-banner";
import {
  addCarerAvailabilityBlock,
  addVisitEvidence,
  deleteCarerAvailabilityBlock,
  reportVisitIncident,
  saveCarerCredential,
  saveVisitChecklistItem,
  updateCarerAvailabilityProfile,
  updateCarerVisitStatus
} from "@/app/carers/actions";
import {
  CarerAvailabilityBlockForm,
  CarerAvailabilityNoteForm,
  CarerChecklistItemForm,
  CarerCredentialForm,
  DeleteCarerAvailabilityBlockForm,
  CarerEvidenceForm,
  CarerIncidentForm,
  CarerStatusActionForm
} from "@/components/carers/carer-forms";
import { StatusBadge } from "@/components/providers/status-badge";
import { type SessionUser } from "@/lib/auth";
import { CarerWorkspaceRecord } from "@/lib/carers";
import { formatDateTime } from "@/lib/providers";
import { getAllowedVisitTransitions } from "@/lib/visit-state";

type CarerWorkspaceSection = "overview" | "availability" | "credentials" | "visit";
type CarerVisit = CarerWorkspaceRecord["visits"][number];
type CarerCredential = CarerWorkspaceRecord["credentials"][number];
type CredentialCoverage = {
  matchedSkills: string[];
  missingSkills: string[];
};

const navItems: Array<{ href: string; icon: string; key: CarerWorkspaceSection; label: string }> = [
  { href: "/carers", icon: "overview", key: "overview", label: "Overview" },
  { href: "/carers/availability", icon: "availability", key: "availability", label: "Availability" },
  { href: "/carers/credentials", icon: "credentials", key: "credentials", label: "Credentials" }
];

function getAvailableActions(visit: CarerVisit) {
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

function getCredentialCardClass(credential: CarerCredential) {
  if (credential.status === "expired" || credential.status === "rejected" || credential.expiryState === "expired") {
    return "credential-card credential-card-critical";
  }

  if (credential.status === "pending" || credential.expiryState === "expiring_soon") {
    return "credential-card credential-card-warning";
  }

  return "credential-card";
}

function getVisitActionSummary(visit?: CarerVisit) {
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

function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

function isCredentialUsable(credential: CarerCredential) {
  return credential.status === "valid" && credential.expiryState !== "expired";
}

function getCredentialCoverageForVisit(
  workspace: CarerWorkspaceRecord,
  visit: CarerVisit
): CredentialCoverage {
  const verifiedCredentialNames = new Set(
    workspace.credentials.filter(isCredentialUsable).map((credential) => normalizeSkill(credential.name))
  );

  const matchedSkills = visit.requiredSkills.filter((skill) =>
    verifiedCredentialNames.has(normalizeSkill(skill))
  );

  return {
    matchedSkills,
    missingSkills: visit.requiredSkills.filter((skill) => !matchedSkills.includes(skill))
  };
}

function getTodayVisits(workspace: CarerWorkspaceRecord) {
  return workspace.visits.filter((visit) => {
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
}

function getPlannerMonthDays() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const calendarStart = new Date(monthStart);
  const startOffset = (calendarStart.getDay() + 6) % 7;
  calendarStart.setDate(calendarStart.getDate() - startOffset);
  const calendarEnd = new Date(monthEnd);
  const endOffset = 6 - ((calendarEnd.getDay() + 6) % 7);
  calendarEnd.setDate(calendarEnd.getDate() + endOffset);
  const totalDays = Math.round((calendarEnd.getTime() - calendarStart.getTime()) / 86400000) + 1;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      key: toDateValue(date),
      weekday: new Intl.DateTimeFormat("en-AU", {
        weekday: "short"
      }).format(date),
      day: new Intl.DateTimeFormat("en-AU", {
        day: "2-digit"
      }).format(date),
      label: new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      }).format(date),
      isCurrentMonth: date.getMonth() === today.getMonth()
    };
  });
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAvailabilityBlockRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = toDateValue(start) === toDateValue(end);
  const timeFormatter = new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (sameDay) {
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  }

  return `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
}

function ReadinessPanel({
  unavailableBlocks,
  workingBlocks,
  workspace
}: {
  unavailableBlocks: number;
  workingBlocks: number;
  workspace: CarerWorkspaceRecord;
}) {
  return (
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
  );
}

function OverviewSection({
  selectedVisit,
  unavailableBlocks,
  workingBlocks,
  workspace
}: {
  selectedVisit?: CarerVisit;
  unavailableBlocks: number;
  workingBlocks: number;
  workspace: CarerWorkspaceRecord;
}) {
  return (
    <>
      <section className="carer-command-grid" id="overview">
        <article className="ops-panel carer-agenda-panel">
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
                <VisitQueueItem
                  isActive={selectedVisit?.id === visit.id}
                  key={visit.id}
                  visit={visit}
                  workspace={workspace}
                />
              ))
            ) : (
              <p className="panel-copy">No assigned visits yet for this carer.</p>
            )}
          </div>
        </article>

        <ReadinessPanel
          unavailableBlocks={unavailableBlocks}
          workingBlocks={workingBlocks}
          workspace={workspace}
        />

        <article className="ops-panel carer-alert-panel">
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
        </article>
      </section>
    </>
  );
}

function VisitQueueItem({
  isActive,
  visit,
  workspace
}: {
  isActive: boolean;
  visit: CarerVisit;
  workspace: CarerWorkspaceRecord;
}) {
  const coverage = getCredentialCoverageForVisit(workspace, visit);

  return (
    <Link
      className={`visit-list-item ${isActive ? "is-active" : ""}`}
      href={`/carers/visits/${visit.id}`}
    >
      <div>
        <strong>
          {visit.orderCode} - {visit.label}
        </strong>
        <p>
          {visit.recipientName} - {visit.serviceType}
        </p>
        <p>{formatDateTime(visit.scheduledStart)} - {formatDateTime(visit.scheduledEnd)}</p>
        <div className="visit-skill-strip">
          <span className={coverage.missingSkills.length > 0 ? "skill-link-warning" : "skill-link-ready"}>
            {coverage.matchedSkills.length}/{visit.requiredSkills.length} credentials matched
          </span>
          {coverage.missingSkills.length > 0 ? (
            <span>Missing: {coverage.missingSkills.join(", ")}</span>
          ) : null}
        </div>
      </div>
      <StatusBadge value={visit.status} />
    </Link>
  );
}

function AvailabilitySection({
  unavailableBlocks,
  workingBlocks,
  workspace
}: {
  unavailableBlocks: number;
  workingBlocks: number;
  workspace: CarerWorkspaceRecord;
}) {
  const plannerDays = getPlannerMonthDays();

  return (
    <section className="split-workspace split-workspace-availability">
      <article className="ops-panel workspace-primary-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Availability</p>
            <h2>Working profile</h2>
            <p className="panel-copy">Maintain normal availability and explicit blocks in one place.</p>
          </div>
          <span className="skill-pill">{workingBlocks} working</span>
        </div>
        <div className="carer-form-strip">
          <CarerAvailabilityNoteForm
            availability={workspace.availability}
            formAction={updateCarerAvailabilityProfile}
          />
          <CarerAvailabilityBlockForm
            availabilityBlocks={workspace.availabilityBlocks}
            formAction={addCarerAvailabilityBlock}
          />
        </div>
      </article>

      <article className="ops-panel workspace-secondary-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Calendar</p>
            <h2>Availability planner</h2>
            <p className="panel-copy">Available days, working blocks, and unavailable blocks are shown together.</p>
          </div>
          <div className="availability-legend">
            <span className="availability-legend-item availability-legend-available">Available</span>
            <span className="availability-legend-item availability-legend-working">{workingBlocks} working</span>
            <span className="availability-legend-item availability-legend-unavailable">
              {unavailableBlocks} unavailable
            </span>
          </div>
        </div>
        <div className="availability-planner">
          {plannerDays.map((day) => {
            const blocks = getBlocksForPlannerDay(workspace.availabilityBlocks, day.key);
            const patternAvailability = getPatternAvailabilityForDay(workspace.availability, day.date);

            return (
              <div
                className={`availability-day ${day.isCurrentMonth ? "" : "is-outside-month"}`}
                key={day.key}
              >
                <strong>
                  <span>{day.weekday}</span>
                  {day.day}
                </strong>
                <div className="availability-day-track">
                  {blocks.length > 0 ? (
                    blocks.map((block) => (
                      <div
                        className={`availability-range ${
                          block.isWorking ? "availability-range-working" : "availability-range-unavailable"
                        }`}
                        key={block.id}
                      >
                        <span>{block.isWorking ? "Working" : "Unavailable"}</span>
                        <p>{formatAvailabilityBlockRange(block.startsAt, block.endsAt)}</p>
                        <DeleteCarerAvailabilityBlockForm
                          blockId={block.id}
                          formAction={deleteCarerAvailabilityBlock}
                        />
                      </div>
                    ))
                  ) : patternAvailability ? (
                    patternAvailability.map((range) => (
                      <div className="availability-range availability-range-pattern" key={range.label}>
                        <span>{range.label}</span>
                        <p>{range.detail}</p>
                      </div>
                    ))
                  ) : (
                    <span className="availability-empty availability-empty-unavailable">
                      Not normally available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {workspace.availabilityBlocks.length === 0 ? (
          <p className="field-help">
            Use the form to add a working or unavailable range. The calendar will color the selected range after saving.
          </p>
        ) : null}
      </article>
    </section>
  );
}

function getBlocksForPlannerDay(
  blocks: CarerWorkspaceRecord["availabilityBlocks"],
  dayKey: string
) {
  const dayStart = new Date(`${dayKey}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return blocks.filter((block) => {
    const blockStart = new Date(block.startsAt);
    const blockEnd = new Date(block.endsAt);

    return blockStart < dayEnd && blockEnd > dayStart;
  });
}

function getPatternAvailabilityForDay(availability: string, date: Date) {
  const day = date.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isWeekend = day === 0 || day === 6;

  switch (availability) {
    case "Available Mon-Fri mornings":
      return isWeekday ? [{ label: "Available", detail: "Mon-Fri morning pattern - 08:00 to 12:00" }] : undefined;
    case "Available Mon-Fri afternoons":
      return isWeekday ? [{ label: "Available", detail: "Mon-Fri afternoon pattern - 12:00 to 17:00" }] : undefined;
    case "Available weekdays full day":
      return isWeekday ? [{ label: "Available", detail: "Weekday full day pattern - 08:00 to 17:00" }] : undefined;
    case "Available Mon-Fri split shift":
      return isWeekday
        ? [
            { label: "Available", detail: "Morning split - 08:00 to 12:00" },
            { label: "Available", detail: "Afternoon split - 14:00 to 18:00" }
          ]
        : undefined;
    case "Available weekends":
      return isWeekend ? [{ label: "Available", detail: "Weekend pattern - 08:00 to 17:00" }] : undefined;
    case "Available evenings":
      return [{ label: "Available", detail: "Evening pattern - 17:00 to 21:00" }];
    case "Limited availability this week":
      return [{ label: "Limited", detail: "Check carer note before assigning" }];
    default:
      return [{ label: "Pattern note", detail: availability }];
  }
}

function getCredentialVisitLinks(workspace: CarerWorkspaceRecord, credential: CarerCredential) {
  const normalizedCredentialName = normalizeSkill(credential.name);

  return workspace.visits.filter((visit) =>
    visit.requiredSkills.some((skill) => normalizeSkill(skill) === normalizedCredentialName)
  );
}

function isVisualEvidence(item: CarerVisit["evidence"][number]) {
  return item.kind.toLowerCase() === "photo" || /\.(png|jpe?g|webp|gif)$/i.test(item.fileUrl);
}

function CredentialsSection({
  expiredCredentials,
  expiringSoon,
  workspace
}: {
  expiredCredentials: number;
  expiringSoon: number;
  workspace: CarerWorkspaceRecord;
}) {
  return (
    <section className="split-workspace split-workspace-credentials">
      <article className="ops-panel workspace-secondary-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Credentials</p>
            <h2>Add readiness evidence</h2>
            <p className="panel-copy">Keep verified skills, expiry dates, and references current.</p>
          </div>
          <span className="skill-pill">{expiredCredentials + expiringSoon} alerts</span>
        </div>
        <CarerCredentialForm formAction={saveCarerCredential} />
      </article>

      <article className="ops-panel workspace-primary-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Records</p>
            <h2>Operational readiness</h2>
          </div>
          <span className="skill-pill">{workspace.credentials.length} records</span>
        </div>
        <div className="sequence-list">
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
                  <span>Expires: {credential.expiresAt ? formatDate(credential.expiresAt) : "No expiry"}</span>
                  <span>{credential.expirySummary}</span>
                </div>
                <div className="credential-alert-summary">
                  <strong>{credential.matchingImpact}</strong>
                  <p>{credential.renewalAction}</p>
                </div>
                {credential.documentUrl ? <p>{credential.documentUrl}</p> : null}
                <div className="credential-visit-links">
                  <strong>Related visits</strong>
                  {getCredentialVisitLinks(workspace, credential).length > 0 ? (
                    <div className="pill-row">
                      {getCredentialVisitLinks(workspace, credential).map((visit) => (
                        <Link className="skill-pill" href={`/carers/visits/${visit.id}`} key={visit.id}>
                          {visit.orderCode}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p>No assigned visits require this credential right now.</p>
                  )}
                </div>
                <details className="inline-edit-details">
                  <summary>Edit credential</summary>
                  <CarerCredentialForm credential={credential} formAction={saveCarerCredential} />
                </details>
              </div>
            ))
          ) : (
            <p className="panel-copy">No credentials recorded for this carer yet.</p>
          )}
        </div>
      </article>
    </section>
  );
}

function VisitExecutionSection({ selectedVisit }: { selectedVisit?: CarerVisit }) {
  if (!selectedVisit) {
    return (
      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Visit execution</p>
            <h2>No visit selected</h2>
            <p className="panel-copy">Return to overview and select a visit from the assigned queue.</p>
          </div>
          <Link className="inline-link" href="/carers">
            Back to overview
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="visit-execution-flow">
        <article className="ops-panel visit-report-panel report-document">
          <div className="report-document-header">
            <div>
              <span className="report-kicker">Care visit record</span>
              <h2>{selectedVisit.recipientName}</h2>
              <p>{selectedVisit.orderCode} - {selectedVisit.orderTitle}</p>
            </div>
            <StatusBadge value={selectedVisit.status} />
          </div>
          <dl className="report-document-grid">
            <div>
              <dt>Care service</dt>
              <dd>{selectedVisit.serviceType}</dd>
            </div>
            <div>
              <dt>Service window</dt>
              <dd>{formatDateTime(selectedVisit.scheduledStart)} - {formatDateTime(selectedVisit.scheduledEnd)}</dd>
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
              <dt>Review readiness</dt>
              <dd>{selectedVisit.executionReadiness.summary}</dd>
            </div>
          </dl>
          <div className="report-preview-grid">
            <div>
              <span className="workspace-icon workspace-icon-checklist" aria-hidden="true" />
              <strong>{selectedVisit.checklistCompletion}%</strong>
              <p>Checklist complete</p>
            </div>
            <div>
              <span className="workspace-icon workspace-icon-evidence" aria-hidden="true" />
              <strong>{selectedVisit.evidence.length}</strong>
              <p>Evidence items</p>
            </div>
            <div>
              <span className="workspace-icon workspace-icon-alert" aria-hidden="true" />
              <strong>{selectedVisit.incidents.length}</strong>
              <p>Exceptions</p>
            </div>
          </div>
          <div className="report-section-block">
            <strong>Care requirements</strong>
            <div className="pill-row">
              {selectedVisit.requiredSkills.map((skill) => (
                <span className="skill-pill" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="report-section-block">
            <strong>Carer note</strong>
            <p>{selectedVisit.notes}</p>
          </div>
          <div className="report-blocker-list">
            <strong>Review blockers</strong>
            {selectedVisit.executionReadiness.reviewBlockers.length > 0 ? (
              <div>
                {selectedVisit.executionReadiness.reviewBlockers.map((blocker) => (
                  <p className="form-warning" key={blocker}>
                    {blocker}
                  </p>
                ))}
              </div>
            ) : (
              <p>Ready for provider review with checklist and evidence attached.</p>
            )}
          </div>
          <div className="report-document-footer">
            <span>Generated from activities, evidence, notes, and exceptions.</span>
            <span>Save, send, print, and archive actions will be handled by the report workflow.</span>
          </div>
        </article>

        <article className="ops-panel visit-actions-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Actions</p>
              <h2>Visit controls</h2>
            </div>
          </div>
          <div className="visit-control-bar">
            <div className="visit-control-primary">
              {getAvailableActions(selectedVisit).length > 0 ? (
                getAvailableActions(selectedVisit).map((action) => (
                  <CarerStatusActionForm
                    action={action}
                    disabled={
                      action === "submit_review" &&
                      selectedVisit.executionReadiness.reviewBlockers.length > 0
                    }
                    formAction={updateCarerVisitStatus}
                    key={action}
                    visitId={selectedVisit.id}
                  />
                ))
              ) : (
                <p className="panel-copy">No state change is available for this visit right now.</p>
              )}
            </div>
            <div className="visit-control-secondary">
              <button className="ghost-link" disabled type="button">
                Print report
              </button>
              <button className="ghost-link" disabled type="button">
                Send report
              </button>
              <button className="ghost-link" disabled type="button">
                Save draft
              </button>
            </div>
          </div>
        </article>

        <article className="ops-panel client-context-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Client context</p>
              <h2>Instructions and requirements</h2>
            </div>
          </div>
          <p className="client-instruction-copy">{selectedVisit.instructions}</p>
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

        <article className="ops-panel visit-checklist-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Care activities</p>
              <h2>What was completed</h2>
            </div>
            <span className="skill-pill">{selectedVisit.checklistCompletion}% complete</span>
          </div>
          <div className="sequence-list">
            {selectedVisit.checklistItems.length > 0 ? (
              selectedVisit.checklistItems.map((item) => (
                <CarerChecklistItemForm
                  formAction={saveVisitChecklistItem}
                  item={item}
                  key={item.templateItemId}
                  visitId={selectedVisit.id}
                />
              ))
            ) : (
              <p className="panel-copy">No checklist template is linked to this visit.</p>
            )}
          </div>
        </article>

        <article className="ops-panel visit-support-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Evidence</p>
              <h2>Captured items</h2>
            </div>
          </div>
          <CarerEvidenceForm formAction={addVisitEvidence} visitId={selectedVisit.id} />
          <div className="evidence-gallery top-gap">
            {selectedVisit.evidence.length > 0 ? (
              selectedVisit.evidence.map((item) => (
                <div className="evidence-card" key={item.id}>
                  {isVisualEvidence(item) ? (
                    <img alt={`${item.kind} evidence`} src={item.fileUrl} />
                  ) : (
                    <div className="evidence-file-preview">
                      <span className="workspace-icon workspace-icon-evidence" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <strong>{item.kind}</strong>
                    <p>{item.fileUrl}</p>
                    <p>
                      {item.capturedAt
                        ? formatDateTime(item.capturedAt)
                        : "Capture time not recorded"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="panel-copy">No evidence captured yet.</p>
            )}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Notes and exceptions</p>
              <h2>Care note or exception</h2>
            </div>
          </div>
          <CarerIncidentForm formAction={reportVisitIncident} visitId={selectedVisit.id} />
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Reported exceptions</p>
              <h2>Current exceptions</h2>
            </div>
          </div>
          <div className="sequence-list">
            {selectedVisit.incidents.length > 0 ? (
              selectedVisit.incidents.map((incident) => (
                <div className="incident-card" key={incident.id}>
                  <strong>
                    {incident.category} - {incident.severity}
                  </strong>
                  <p>{incident.summary}</p>
                  <p>
                    Occurred {formatDateTime(incident.occurredAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="panel-copy">No incidents reported for this visit.</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

export function CarerWorkspace({
  currentSection = "overview",
  selectedVisitId,
  session,
  workspace
}: {
  currentSection?: CarerWorkspaceSection;
  selectedVisitId?: string;
  session: SessionUser;
  workspace: CarerWorkspaceRecord;
}) {
  const selectedVisit =
    workspace.visits.find((visit) => visit.id === selectedVisitId) ?? workspace.visits[0];
  const todayVisits = getTodayVisits(workspace);
  const expiringSoon = workspace.credentials.filter((credential) => credential.isExpiringSoon).length;
  const expiredCredentials = workspace.credentials.filter(
    (credential) => credential.status === "expired" || credential.expiryState === "expired"
  ).length;
  const workingBlocks = workspace.availabilityBlocks.filter((block) => block.isWorking).length;
  const unavailableBlocks = workspace.availabilityBlocks.length - workingBlocks;
  const blockerCount = workspace.readinessSummary.blockerSignals.length;
  const attentionCount = workspace.readinessSummary.attentionSignals.length;

  return (
    <main className="providers-shell carer-workspace-shell carer-theme">
      <aside className="providers-sidebar carer-sidebar">
        <Link className="providers-brand" href="/">
          Serenity
        </Link>
        <p className="providers-sidebar-copy">
          Field execution workspace for assigned visits, readiness, and profile maintenance.
        </p>
        <nav className="providers-nav" aria-label="Carer workspace">
          {navItems.map((item) => (
            <Link
              className={`providers-nav-link ${currentSection === item.key ? "is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className={`workspace-icon workspace-icon-${item.icon}`} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
          {selectedVisit ? (
            <Link
              className={`providers-nav-link ${currentSection === "visit" ? "is-active" : ""}`}
              href={`/carers/visits/${selectedVisit.id}`}
            >
              <span className="workspace-icon workspace-icon-checklist" aria-hidden="true" />
              Visit execution
            </Link>
          ) : null}
        </nav>
        <SessionBanner session={session} />
      </aside>

      <section className="providers-main">
        <header className="providers-header carer-hero-panel">
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
        </header>

        <section className="metrics-grid metrics-grid-4">
          <Link className="metric-card metric-neutral metric-action-card" href="/carers">
            <div className="metric-card-head">
              <p>Assigned visits</p>
              <span className="metric-icon metric-icon-visits" aria-hidden="true" />
            </div>
            <strong>{workspace.visits.length}</strong>
            <span>Current assignments</span>
          </Link>
          <Link className="metric-card metric-positive metric-action-card" href="/carers">
            <div className="metric-card-head">
              <p>Today</p>
              <span className="metric-icon metric-icon-today" aria-hidden="true" />
            </div>
            <strong>{todayVisits.length}</strong>
            <span>Scheduled in Australia/Sydney</span>
          </Link>
          <Link className="metric-card metric-warning metric-action-card" href="/carers">
            <div className="metric-card-head">
              <p>Readiness</p>
              <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
            </div>
            <strong>{workspace.readinessStatus.replaceAll("_", " ")}</strong>
            <span>{blockerCount} blockers - {attentionCount} attention signals</span>
          </Link>
          <Link className="metric-card metric-critical metric-action-card" href="/carers/credentials">
            <div className="metric-card-head">
              <p>Credential alerts</p>
              <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
            </div>
            <strong>{expiredCredentials + expiringSoon}</strong>
            <span>{expiredCredentials} expired - {expiringSoon} expiring in 45 days</span>
          </Link>
        </section>

        {currentSection === "overview" ? (
          <OverviewSection
            selectedVisit={selectedVisit}
            unavailableBlocks={unavailableBlocks}
            workingBlocks={workingBlocks}
            workspace={workspace}
          />
        ) : null}
        {currentSection === "availability" ? (
          <AvailabilitySection
            unavailableBlocks={unavailableBlocks}
            workingBlocks={workingBlocks}
            workspace={workspace}
          />
        ) : null}
        {currentSection === "credentials" ? (
          <CredentialsSection
            expiredCredentials={expiredCredentials}
            expiringSoon={expiringSoon}
            workspace={workspace}
          />
        ) : null}
        {currentSection === "visit" ? <VisitExecutionSection selectedVisit={selectedVisit} /> : null}
      </section>
    </main>
  );
}
