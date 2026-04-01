import { notFound } from "next/navigation";
import { OrderAuditTimeline } from "@/components/audit/order-audit-timeline";
import { CenterShell } from "@/components/centers/center-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { listOrderAuditEvents } from "@/lib/audit-data";
import { CENTER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getCenterOrder } from "@/lib/centers-data";
import { formatDateTime } from "@/lib/providers";

export const dynamic = "force-dynamic";

export default async function CenterOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOrganizationUser(CENTER_ROLES);
  const { id } = await params;
  const [order, auditEvents] = await Promise.all([
    getCenterOrder(id, session.organizationId),
    listOrderAuditEvents(id, session.organizationId)
  ]);

  if (!order) {
    notFound();
  }

  return (
    <CenterShell
      title={`${order.code} · ${order.title}`}
      subtitle="Seguimiento de cobertura, ejecucion, evidencia y auditoria dentro del limite operativo del centro."
    >
      <section className="ops-overview-grid">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Order summary</p>
              <h2>{order.recipientName}</h2>
            </div>
            <StatusBadge value={order.status} />
          </div>
          <dl className="meta-grid">
            <div>
              <dt>Provider</dt>
              <dd>{order.providerName}</dd>
            </div>
            <div>
              <dt>Facility</dt>
              <dd>{order.facilityName}</dd>
            </div>
            <div>
              <dt>Service type</dt>
              <dd>{order.serviceType}</dd>
            </div>
            <div>
              <dt>Frequency</dt>
              <dd>{order.frequency}</dd>
            </div>
            <div>
              <dt>Planned duration</dt>
              <dd>{order.plannedDurationMin} min</dd>
            </div>
            <div>
              <dt>Required language</dt>
              <dd>{order.requiredLanguage ?? "Not specified"}</dd>
            </div>
          </dl>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Care brief</p>
              <h2>What the provider received</h2>
            </div>
          </div>
          <p className="panel-copy">{order.instructions}</p>
          <div className="note-block">
            <strong>Provider handoff note</strong>
            <p>{order.notesForCoordinator}</p>
          </div>
          <div className="pill-row">
            {order.requiredSkills.map((skill) => (
              <span className="skill-pill" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Visit visibility</p>
              <h2>Coverage and outcomes</h2>
            </div>
          </div>
          <div className="sequence-list">
            {order.visits.map((visit) => (
              <div className="note-block" key={visit.id}>
                <div className="order-row-meta">
                  <strong>{visit.label}</strong>
                  <StatusBadge value={visit.status} />
                </div>
                <p>
                  {formatDateTime(visit.scheduledStart)} - {formatDateTime(visit.scheduledEnd)}
                </p>
                <p>{visit.assignedCarerName ?? "Coverage still unassigned"}</p>
                <p>{visit.notes}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Compliance trace</p>
              <h2>Incidents and review</h2>
            </div>
          </div>
          <div className="sequence-list">
            {order.visits.map((visit) => (
              <div className="note-block" key={`${visit.id}-trace`}>
                <strong>{visit.label}</strong>
                {visit.incident ? (
                  <p>
                    Incident: {visit.incident.category} · {visit.incident.severity} · {visit.incident.summary}
                  </p>
                ) : (
                  <p>No incident recorded.</p>
                )}
                {visit.review ? (
                  <p>
                    Review: {visit.review.outcome} by {visit.review.reviewer} at {formatDateTime(visit.review.at)}
                  </p>
                ) : (
                  <p>No review decision yet.</p>
                )}
                <p>{visit.evidenceCount} evidence items captured.</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <OrderAuditTimeline events={auditEvents} />
    </CenterShell>
  );
}
