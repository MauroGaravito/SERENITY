import { notFound } from "next/navigation";
import { OrderAuditTimeline } from "@/components/audit/order-audit-timeline";
import { ProviderOrderEditForm } from "@/components/providers/provider-order-edit-form";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { ProviderVisitCreateForm } from "@/components/providers/provider-visit-create-form";
import { VisitControlPanel } from "@/components/providers/visit-control-panel";
import { listOrderAuditEvents } from "@/lib/audit-data";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { formatDateTime } from "@/lib/providers";
import { getProviderOrder } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default async function ProviderOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const { id } = await params;
  const [order, auditEvents] = await Promise.all([
    getProviderOrder(id, session.organizationId),
    listOrderAuditEvents(id, session.organizationId)
  ]);

  if (!order) {
    notFound();
  }

  return (
    <ProviderShell
      currentSection="orders"
      title={`${order.code} · ${order.title}`}
      subtitle="Validacion operativa del flujo provider: asignacion, estados de visita, revision y auditoria."
    >
      <section className="ops-overview-grid">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Order summary</p>
              <h2>{order.recipientName}</h2>
            </div>
            <div className="stacked-statuses">
              <StatusBadge value={order.status} />
              <StatusBadge value={order.coverageStatus} />
            </div>
          </div>
          <dl className="meta-grid">
            <div>
              <dt>Center</dt>
              <dd>{order.centerName}</dd>
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
            <div>
              <dt>Pending action</dt>
              <dd>{order.pendingAction}</dd>
            </div>
          </dl>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Coordinator notes</p>
              <h2>Operating constraints</h2>
            </div>
          </div>
          <p className="panel-copy">{order.instructions}</p>
          <div className="note-block">
            <strong>Coordinator note</strong>
            <p>{order.notesForCoordinator}</p>
          </div>
          {order.escalationSummary ? (
            <div className="note-block">
              <strong>Escalation summary</strong>
              <p>{order.escalationSummary}</p>
            </div>
          ) : null}
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
        <ProviderOrderEditForm order={order} />
        <ProviderVisitCreateForm orderId={order.id} />
      </section>

      <VisitControlPanel
        canReviewVisits={session.role === UserRole.PROVIDER_REVIEWER}
        order={order}
      />

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Coverage pool</p>
              <h2>Assignment and restrictions</h2>
            </div>
          </div>
          <div className="sequence-list">
            {order.eligibleCarers.map((carer) => (
              <div key={carer.id}>
                <strong>{carer.name}</strong>
                <p>
                  {carer.availability} · rating {carer.rating.toFixed(1)}
                </p>
                <p>
                  {carer.availabilityStatus.replaceAll("_", " ")} · {carer.availabilitySummary}
                </p>
                <p>
                  {carer.isEligible
                    ? `Eligible · ${carer.credentials.join(" · ")}`
                    : carer.eligibilityReasons.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Upcoming windows</p>
              <h2>Visit schedule</h2>
            </div>
          </div>
          <div className="sequence-list">
            {order.visits.map((visit) => (
              <div key={visit.id}>
                <strong>{visit.label}</strong>
                <p>
                  {formatDateTime(visit.scheduledStart)} - {formatDateTime(visit.scheduledEnd)}
                </p>
                <p>
                  {visit.assignedCarerName ?? "No carer assigned yet"} ·{" "}
                  {visit.coverageStatus.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <OrderAuditTimeline events={auditEvents} />
    </ProviderShell>
  );
}
