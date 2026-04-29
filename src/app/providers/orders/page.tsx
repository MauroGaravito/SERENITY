import Link from "next/link";
import { ProviderOrderForm } from "@/components/providers/provider-order-form";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getProviderOrderFormData, listProviderOrders } from "@/lib/providers-data";
import { ServiceOrderRecord, VisitStatus } from "@/lib/providers";

export const dynamic = "force-dynamic";

type OrdersSearchParams = {
  risk?: string;
  priority?: string;
  status?: string;
  visitStatus?: string;
};

function isOrderRisk(value: string): value is ServiceOrderRecord["coverageRisk"] {
  return ["critical", "warning", "stable"].includes(value);
}

function isOrderPriority(value: string): value is ServiceOrderRecord["priority"] {
  return ["critical", "high", "medium", "low"].includes(value);
}

function isOrderStatus(value: string): value is ServiceOrderRecord["status"] {
  return [
    "draft",
    "open",
    "partially_assigned",
    "assigned",
    "active",
    "completed",
    "closed",
    "cancelled"
  ].includes(value);
}

function isVisitStatus(value: string): value is VisitStatus {
  return [
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "under_review",
    "approved",
    "rejected",
    "cancelled",
    "no_show"
  ].includes(value);
}

function getFilterLabel(searchParams: OrdersSearchParams) {
  if (searchParams.risk && isOrderRisk(searchParams.risk)) {
    return `${searchParams.risk} risk`;
  }

  if (searchParams.priority && isOrderPriority(searchParams.priority)) {
    return `${searchParams.priority} priority`;
  }

  if (searchParams.status && isOrderStatus(searchParams.status)) {
    return `${searchParams.status.replaceAll("_", " ")} status`;
  }

  if (searchParams.visitStatus && isVisitStatus(searchParams.visitStatus)) {
    return `${searchParams.visitStatus.replaceAll("_", " ")} visits`;
  }

  return "all active provider demand";
}

function filterOrders(orders: ServiceOrderRecord[], searchParams: OrdersSearchParams) {
  return orders.filter((order) => {
    if (searchParams.risk && isOrderRisk(searchParams.risk)) {
      return order.coverageRisk === searchParams.risk;
    }

    if (searchParams.priority && isOrderPriority(searchParams.priority)) {
      return order.priority === searchParams.priority;
    }

    if (searchParams.status && isOrderStatus(searchParams.status)) {
      if (searchParams.status === "open") {
        return ["open", "partially_assigned", "assigned"].includes(order.status);
      }

      return order.status === searchParams.status;
    }

    if (searchParams.visitStatus && isVisitStatus(searchParams.visitStatus)) {
      return order.visits.some((visit) => visit.status === searchParams.visitStatus);
    }

    return true;
  });
}

export default async function ProviderOrdersPage({
  searchParams
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const providerId = session.organizationId;
  const params = await searchParams;
  const [orders, formData] = await Promise.all([
    listProviderOrders(providerId),
    getProviderOrderFormData(providerId)
  ]);
  const filteredOrders = filterOrders(orders, params);
  const filterLabel = getFilterLabel(params);

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
            <h2>{filterLabel}</h2>
            <p className="panel-copy">
              Showing {filteredOrders.length} of {orders.length} orders.
            </p>
          </div>
          {(params.risk || params.priority || params.status || params.visitStatus) ? (
            <Link className="inline-link" href="/providers/orders">
              Clear filter
            </Link>
          ) : null}
        </div>

        <div className="orders-table">
        <div className="orders-table-head">
          <span>Order</span>
          <span>Recipient</span>
          <span>Action</span>
          <span>Risk</span>
          <span>Status</span>
        </div>

          {filteredOrders.map((order) => (
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
                <strong>{order.coverageStatus.replaceAll("_", " ")}</strong>
                <p>{order.pendingAction}</p>
              </div>
              <div>
                <span className={`risk-pill risk-${order.coverageRisk}`}>
                  {order.coverageRisk}
                </span>
              </div>
              <div>
                <div className="stacked-statuses">
                  <StatusBadge value={order.status} />
                  <StatusBadge value={order.coverageStatus} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ProviderShell>
  );
}

