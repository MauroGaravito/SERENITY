import Link from "next/link";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import {
  getProviderMetrics,
  listProviderActionQueue,
  listProviderOrders
} from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const providerId = session.organizationId;
  const [metrics, orders, actionQueue] = await Promise.all([
    getProviderMetrics(providerId),
    listProviderOrders(providerId),
    listProviderActionQueue(providerId)
  ]);

  return (
    <ProviderShell
      currentSection="dashboard"
      title="Operational command center"
      subtitle="La prestadora opera cobertura, ejecucion, revision y cierre desde un solo lugar."
    >
      <section className="metrics-grid">
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
              <p className="card-tag">Coverage queue</p>
              <h2>Orders needing action</h2>
            </div>
            <Link className="inline-link" href="/providers/orders">
              View all orders
            </Link>
          </div>
          <div className="order-rows">
            {orders.map((order) => (
              <Link className="order-row" href={`/providers/orders/${order.id}`} key={order.id}>
              <div>
                <strong>
                  {order.code} · {order.title}
                </strong>
                <p>
                  {order.centerName} · {order.facilityName}
                </p>
                <p>{order.pendingAction}</p>
              </div>
              <div className="order-row-meta">
                <StatusBadge value={order.status} />
                <StatusBadge value={order.coverageStatus} />
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
              <p className="card-tag">Closing pressure</p>
              <h2>What to clear next</h2>
            </div>
          </div>
          <div className="sequence-list">
            {actionQueue.map((item, index) => (
              <div key={item.id}>
                <strong>
                  {index + 1}. {item.code} · {item.title}
                </strong>
                <p>{item.pendingAction}</p>
                <p>
                  {item.nextVisitLabel} · {item.coverageStatus.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </ProviderShell>
  );
}

