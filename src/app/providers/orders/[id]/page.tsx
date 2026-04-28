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
      subtitle="Follow the service order from demand through coverage, visit execution, and review."
    >
      <section className="order-command-bar">
        <article className="ops-panel order-command-primary">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Order summary</p>
              <h2>{order.recipientName}</h2>
              <p className="panel-copy">
                {order.centerName} - {order.facilityName} - {order.serviceType}
              </p>
            </div>
            <div className="stacked-statuses">
              <StatusBadge value={order.status} />
              <StatusBadge value={order.coverageStatus} />
            </div>
          </div>
          <div className="order-widget-grid">
            <div className="order-widget">
              <span className="metric-icon metric-icon-today" aria-hidden="true" />
              <strong>{order.visits.length}</strong>
              <p>Visits</p>
            </div>
            <div className="order-widget">
              <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
              <strong>{order.priority}</strong>
              <p>Priority</p>
            </div>
            <div className="order-widget">
              <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
              <strong>{Math.round(order.plannedDurationMin / 60)}h</strong>
              <p>Duration</p>
            </div>
            <div className="order-widget">
              <span className="metric-icon metric-icon-visits" aria-hidden="true" />
              <strong>{order.requiredSkills.length}</strong>
              <p>Skills</p>
            </div>
          </div>
          <dl className="meta-grid order-meta-strip">
            <div>
              <dt>Requested pattern</dt>
              <dd>{order.frequency}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{order.requiredLanguage ?? "Not specified"}</dd>
            </div>
            <div>
              <dt>Pending action</dt>
              <dd>{order.pendingAction}</dd>
            </div>
          </dl>
        </article>

        <article className="ops-panel order-command-notes">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Brief</p>
              <h2>Instructions</h2>
            </div>
          </div>
          <div className="note-block">
            <strong>Care instructions</strong>
            <p>{order.instructions}</p>
          </div>
          <div className="note-block">
            <strong>Coordinator note</strong>
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

      <section className="order-workbench">
        <article className="ops-panel order-workbench-main">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Visits</p>
              <h2>Visit schedule and coverage</h2>
              <p className="panel-copy">
                Select one visit to review its coverage, care record, evidence, and next action.
              </p>
            </div>
          </div>
          <VisitControlPanel
            canReviewVisits={session.role === UserRole.PROVIDER_REVIEWER}
            order={order}
          />
        </article>

        <aside className="order-workbench-side">
          <details className="ops-panel workspace-detail-section order-detail-toggle">
            <summary>
              <span>Edit request</span>
              <strong>Service request</strong>
              <small>Update title, priority, care window, skills, and notes</small>
            </summary>
            <ProviderOrderEditForm order={order} />
          </details>

          <details className="ops-panel workspace-detail-section order-detail-toggle">
            <summary>
              <span>Schedule</span>
              <strong>Add another visit</strong>
              <small>Create an extra dated visit for this order</small>
            </summary>
            <ProviderVisitCreateForm orderId={order.id} />
          </details>
        </aside>
      </section>

      <OrderAuditTimeline events={auditEvents} />
    </ProviderShell>
  );
}
