import Link from "next/link";
import { CenterShell } from "@/components/centers/center-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { CENTER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getCenterMetrics, listCenterOrders } from "@/lib/centers-data";

export const dynamic = "force-dynamic";

export default async function CentersPage() {
  const session = await requireOrganizationUser(CENTER_ROLES);
  const centerId = session.organizationId;
  const [metrics, orders] = await Promise.all([
    getCenterMetrics(centerId),
    listCenterOrders(centerId)
  ]);
  const recentOrders = orders.slice(0, 3);

  return (
    <CenterShell
      title="Demand and compliance"
      subtitle="El centro crea requerimientos, entrega contexto operativo y monitorea cobertura sin invadir la operacion de la prestadora."
    >
      <section className="metrics-grid metrics-grid-4">
        {metrics.map((metric) => (
          <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Recent demand</p>
              <h2>Orders submitted by this center</h2>
            </div>
            <Link className="inline-link" href="/centers/orders">
              Open all orders
            </Link>
          </div>
          <div className="order-rows">
            {recentOrders.map((order) => (
              <Link className="order-row" href={`/centers/orders/${order.id}`} key={order.id}>
                <div>
                  <strong>
                    {order.code} · {order.title}
                  </strong>
                  <p>
                    {order.recipientName} · {order.facilityName}
                  </p>
                </div>
                <div className="order-row-meta">
                  <StatusBadge value={order.status} />
                  <span className={`risk-pill risk-${order.coverageRisk}`}>
                    {order.coverageRisk} risk
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Center rules</p>
              <h2>Role boundary</h2>
            </div>
          </div>
          <div className="sequence-list">
            <div>
              <strong>1. Center defines the demand</strong>
              <p>Recipient, timing, skills and service constraints start here.</p>
            </div>
            <div>
              <strong>2. Provider owns coverage</strong>
              <p>Assignment, execution and review remain on the provider lane.</p>
            </div>
            <div>
              <strong>3. Center follows outcomes</strong>
              <p>Coverage, incidents and approved visits stay visible for compliance.</p>
            </div>
          </div>
        </article>
      </section>
    </CenterShell>
  );
}
