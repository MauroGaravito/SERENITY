import Link from "next/link";
import { ProviderOrderForm } from "@/components/providers/provider-order-form";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getProviderOrderFormData, listProviderOrders } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default async function ProviderOrdersPage() {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const providerId = session.organizationId;
  const [orders, formData] = await Promise.all([
    listProviderOrders(providerId),
    getProviderOrderFormData()
  ]);

  return (
    <ProviderShell
      currentSection="orders"
      title="Service orders"
      subtitle="Lista operativa para coordinacion, cobertura y seguimiento de visitas."
    >
      <ProviderOrderForm formData={formData} />

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Orders</p>
            <h2>All active provider demand</h2>
          </div>
        </div>

        <div className="orders-table">
          <div className="orders-table-head">
            <span>Order</span>
            <span>Recipient</span>
            <span>Visits</span>
            <span>Risk</span>
            <span>Status</span>
          </div>

          {orders.map((order) => (
            <Link className="orders-table-row" href={`/providers/orders/${order.id}`} key={order.id}>
              <div>
                <strong>{order.code}</strong>
                <p>{order.title}</p>
              </div>
              <div>
                <strong>{order.recipientName}</strong>
                <p>{order.centerName}</p>
              </div>
              <div>
                <strong>{order.visits.length}</strong>
                <p>{order.frequency}</p>
              </div>
              <div>
                <span className={`risk-pill risk-${order.coverageRisk}`}>
                  {order.coverageRisk}
                </span>
              </div>
              <div>
                <StatusBadge value={order.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ProviderShell>
  );
}

