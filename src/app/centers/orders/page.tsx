import Link from "next/link";
import { CenterOrderForm } from "@/components/centers/center-order-form";
import { CenterShell } from "@/components/centers/center-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { CENTER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getCenterOrderFormData, listCenterOrders } from "@/lib/centers-data";

export const dynamic = "force-dynamic";

export default async function CenterOrdersPage() {
  const session = await requireOrganizationUser(CENTER_ROLES);
  const centerId = session.organizationId;
  const [orders, formData] = await Promise.all([
    listCenterOrders(centerId),
    getCenterOrderFormData(centerId)
  ]);

  return (
    <CenterShell
      currentSection="orders"
      title="Service requests"
      subtitle="El centro convierte necesidad operativa en demanda estructurada para la prestadora."
    >
      <CenterOrderForm formData={formData} />

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Orders</p>
            <h2>All center requests</h2>
          </div>
        </div>

        <div className="orders-table">
          <div className="orders-table-head">
            <span>Order</span>
            <span>Service</span>
            <span>Recipient</span>
            <span>Risk</span>
            <span>Status</span>
          </div>

          {orders.map((order) => (
            <Link className="orders-table-row" href={`/centers/orders/${order.id}`} key={order.id}>
              <div>
                <strong>{order.code}</strong>
                <p>{order.title}</p>
              </div>
              <div>
                <strong>{order.serviceType}</strong>
                <p>{order.frequency}</p>
              </div>
              <div>
                <strong>{order.recipientName}</strong>
                <p>{order.facilityName}</p>
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
    </CenterShell>
  );
}
