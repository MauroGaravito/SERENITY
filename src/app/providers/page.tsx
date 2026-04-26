import Link from "next/link";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { listProviderOrders } from "@/lib/providers-data";
import { ServiceOrderRecord } from "@/lib/providers";

export const dynamic = "force-dynamic";

const priorityWeight: Record<ServiceOrderRecord["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const riskWeight: Record<ServiceOrderRecord["coverageRisk"], number> = {
  critical: 0,
  warning: 1,
  stable: 2
};

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function ratio(value: number, total: number) {
  if (total === 0 || value === 0) {
    return 0;
  }

  return Math.max(8, Math.round((value / total) * 100));
}

function sortByOperationalPressure(orders: ServiceOrderRecord[]) {
  return [...orders].sort((left, right) => {
    const riskDelta = riskWeight[left.coverageRisk] - riskWeight[right.coverageRisk];

    if (riskDelta !== 0) {
      return riskDelta;
    }

    const priorityDelta = priorityWeight[left.priority] - priorityWeight[right.priority];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.code.localeCompare(right.code);
  });
}

export default async function ProvidersPage() {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const orders = await listProviderOrders(session.organizationId);

  const openOrders = orders.filter((order) => order.status !== "closed");
  const allVisits = orders.flatMap((order) => order.visits);
  const underReviewVisits = allVisits.filter((visit) => visit.status === "under_review").length;
  const approvedVisits = allVisits.filter((visit) => visit.status === "approved").length;
  const replacementVisits = allVisits.filter(
    (visit) => visit.coverageStatus === "needs_replacement"
  ).length;
  const unassignedVisits = allVisits.filter((visit) => !visit.assignedCarerId).length;
  const urgentCoverage = unassignedVisits + replacementVisits;
  const coveragePressureOrders = orders.filter((order) =>
    order.visits.some(
      (visit) => !visit.assignedCarerId || visit.coverageStatus === "needs_replacement"
    )
  ).length;

  const lifecycleCounts = countBy(orders.map((order) => order.status));
  const priorityCounts = countBy(orders.map((order) => order.priority));
  const riskCounts = countBy(orders.map((order) => order.coverageRisk));
  const prioritizedOrders = sortByOperationalPressure(orders);
  const nextOrders = prioritizedOrders.slice(0, 4);

  const statusSegments = [
    {
      label: "Open",
      value:
        (lifecycleCounts.open ?? 0) +
        (lifecycleCounts.partially_assigned ?? 0) +
        (lifecycleCounts.assigned ?? 0),
      href: "/providers/orders?status=open"
    },
    {
      label: "Active",
      value: lifecycleCounts.active ?? 0,
      href: "/providers/orders?status=active"
    },
    {
      label: "Review",
      value: lifecycleCounts.completed ?? 0,
      href: "/providers/orders?status=completed"
    },
    {
      label: "Closed",
      value: (lifecycleCounts.closed ?? 0) + (lifecycleCounts.cancelled ?? 0),
      href: "/providers/orders?status=closed"
    }
  ];

  const riskSegments = [
    {
      label: "Critical",
      value: riskCounts.critical ?? 0,
      tone: "critical",
      href: "/providers/orders?risk=critical"
    },
    {
      label: "Warning",
      value: riskCounts.warning ?? 0,
      tone: "warning",
      href: "/providers/orders?risk=warning"
    },
    {
      label: "Stable",
      value: riskCounts.stable ?? 0,
      tone: "positive",
      href: "/providers/orders?risk=stable"
    }
  ];

  const prioritySegments = [
    {
      label: "Critical",
      value: priorityCounts.critical ?? 0,
      tone: "critical",
      href: "/providers/orders?priority=critical"
    },
    {
      label: "High",
      value: priorityCounts.high ?? 0,
      tone: "warning",
      href: "/providers/orders?priority=high"
    },
    {
      label: "Medium",
      value: priorityCounts.medium ?? 0,
      tone: "neutral",
      href: "/providers/orders?priority=medium"
    },
    {
      label: "Low",
      value: priorityCounts.low ?? 0,
      tone: "positive",
      href: "/providers/orders?priority=low"
    }
  ];

  return (
    <ProviderShell
      currentSection="dashboard"
      title="Operational command center"
      subtitle="La prestadora opera cobertura, ejecucion, revision y cierre desde un solo lugar."
    >
      <section className="dashboard-control-room">
        <article className="dashboard-summary-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Operational picture</p>
              <h2>Current workload</h2>
            </div>
            <Link className="inline-link" href="/providers/orders">
              View orders
            </Link>
          </div>

          <div className="dashboard-summary-strip">
            <Link className="summary-stat-card" href="/providers/orders">
              <span>Orders in flight</span>
              <strong>{openOrders.length}</strong>
              <p>Active demand under coordination.</p>
            </Link>
            <Link
              className="summary-stat-card summary-stat-card-critical"
              href="/providers/orders?risk=critical"
            >
              <span>Coverage pressure</span>
              <strong>{coveragePressureOrders}</strong>
              <p>{urgentCoverage} visits need assignment or replacement.</p>
            </Link>
            <Link
              className="summary-stat-card summary-stat-card-warning"
              href="/providers/orders?visitStatus=under_review"
            >
              <span>Pending review</span>
              <strong>{underReviewVisits}</strong>
              <p>Visits waiting for a decision.</p>
            </Link>
            <Link
              className="summary-stat-card summary-stat-card-positive"
              href="/providers/closing"
            >
              <span>Ready for closing</span>
              <strong>{approvedVisits}</strong>
              <p>Approved visits ready to settle.</p>
            </Link>
          </div>
        </article>

        <section className="dashboard-signal-grid">
          <article className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <strong>Lifecycle</strong>
              <span>{orders.length} total orders</span>
            </div>
            <div className="stacked-bar">
              {statusSegments.map((segment) => (
                <Link
                  className={`stacked-bar-segment stacked-bar-${segment.label.toLowerCase()}`}
                  href={segment.href}
                  key={segment.label}
                  style={{ width: `${ratio(segment.value, orders.length)}%` }}
                >
                  {segment.value > 0 ? segment.value : null}
                </Link>
              ))}
            </div>
            <div className="dashboard-mini-link-grid">
              {statusSegments.map((segment) => (
                <Link className="dashboard-filter-chip" href={segment.href} key={segment.label}>
                  <span>{segment.label}</span>
                  <strong>{segment.value}</strong>
                </Link>
              ))}
            </div>
          </article>

          <article className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <strong>Risk</strong>
              <span>Coverage pressure by risk</span>
            </div>
            <div className="signal-bar-list">
              {riskSegments.map((segment) => (
                <Link className="signal-bar-row" href={segment.href} key={segment.label}>
                  <div className="signal-bar-copy">
                    <strong>{segment.label}</strong>
                    <span>{segment.value} orders</span>
                  </div>
                  <div className="signal-bar-track">
                    <div
                      className={`signal-bar-fill signal-bar-${segment.tone}`}
                      style={{ width: `${ratio(segment.value, orders.length)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <strong>Priority</strong>
              <span>Demand urgency</span>
            </div>
            <div className="signal-bar-list">
              {prioritySegments.map((segment) => (
                <Link className="signal-bar-row" href={segment.href} key={segment.label}>
                  <div className="signal-bar-copy">
                    <strong>{segment.label}</strong>
                    <span>{segment.value} orders</span>
                  </div>
                  <div className="signal-bar-track">
                    <div
                      className={`signal-bar-fill signal-bar-${segment.tone}`}
                      style={{ width: `${ratio(segment.value, orders.length)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <article className="dashboard-summary-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Next orders</p>
              <h2>Priority queue</h2>
            </div>
          </div>
          <div className="dashboard-action-list">
            {nextOrders.map((order) => (
              <Link className="dashboard-action-row" href={`/providers/orders/${order.id}`} key={order.id}>
                <div>
                  <strong>
                    {order.code} - {order.title}
                  </strong>
                  <p>
                    {order.centerName} - {order.facilityName}
                  </p>
                </div>
                <div className="dashboard-action-meta">
                  <StatusBadge value={order.status} />
                  <span className={`risk-pill risk-${order.coverageRisk}`}>{order.coverageRisk}</span>
                  <span
                    className={`risk-pill risk-${
                      order.priority === "critical"
                        ? "critical"
                        : order.priority === "high"
                          ? "warning"
                          : "stable"
                    }`}
                  >
                    {order.priority}
                  </span>
                </div>
                <p>{order.pendingAction}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </ProviderShell>
  );
}
