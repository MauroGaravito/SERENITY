import Link from "next/link";
import { ProviderShell } from "@/components/providers/provider-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { PROVIDER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { listProviderCarers, listProviderOrders } from "@/lib/providers-data";
import { CarerOption, ServiceOrderRecord, VisitRecord, formatDateTime } from "@/lib/providers";

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

type VisitWithOrder = VisitRecord & {
  centerName: string;
  orderCode: string;
  orderId: string;
  orderPriority: ServiceOrderRecord["priority"];
  orderTitle: string;
  recipientName: string;
  serviceType: string;
};

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

function isToday(value: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return formatter.format(new Date(value)) === formatter.format(new Date());
}

function getVisitTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getCarerRoster(orders: ServiceOrderRecord[]) {
  const carers = new Map<string, CarerOption>();

  orders.forEach((order) => {
    order.eligibleCarers.forEach((carer) => {
      if (!carers.has(carer.id)) {
        carers.set(carer.id, carer);
      }
    });
  });

  return [...carers.values()].sort((left, right) => {
    const readinessOrder = { ready: 0, attention_needed: 1, restricted: 2 };
    const readinessDelta = readinessOrder[left.readinessStatus] - readinessOrder[right.readinessStatus];

    if (readinessDelta !== 0) {
      return readinessDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

function getVisitWorklist(orders: ServiceOrderRecord[]): VisitWithOrder[] {
  return orders.flatMap((order) =>
    order.visits.map((visit) => ({
      ...visit,
      centerName: order.centerName,
      orderCode: order.code,
      orderId: order.id,
      orderPriority: order.priority,
      orderTitle: order.title,
      recipientName: order.recipientName,
      serviceType: order.serviceType
    }))
  );
}

function getPriorityTone(priority: ServiceOrderRecord["priority"]) {
  if (priority === "critical") {
    return "critical";
  }

  if (priority === "high") {
    return "warning";
  }

  return "stable";
}

export default async function ProvidersPage() {
  const session = await requireOrganizationUser(PROVIDER_ROLES);
  const [orders, carers] = await Promise.all([
    listProviderOrders(session.organizationId),
    listProviderCarers(session.organizationId)
  ]);

  const allVisits = getVisitWorklist(orders);
  const todayVisits = allVisits
    .filter((visit) => isToday(visit.scheduledStart))
    .sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart));
  const coverageVisits = allVisits
    .filter(
      (visit) =>
        !visit.assignedCarerId ||
        visit.coverageStatus === "needs_replacement" ||
        visit.status === "no_show"
    )
    .sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart));
  const reviewVisits = allVisits.filter((visit) => visit.status === "under_review");
  const closingVisits = allVisits.filter((visit) => visit.status === "approved");
  const activeOrders = orders.filter((order) => !["closed", "cancelled"].includes(order.status));
  const prioritizedOrders = sortByOperationalPressure(orders).slice(0, 4);
  const orderCarers = getCarerRoster(orders);
  const rosterCarers = orderCarers.length > 0 ? orderCarers : carers;
  const readyCarers = rosterCarers.filter((carer) => carer.readinessStatus === "ready");
  const carersNeedingAttention = rosterCarers.filter((carer) => carer.readinessStatus !== "ready");
  const credentialAlerts = rosterCarers.reduce((total, carer) => total + carer.credentialAlertCount, 0);
  const uncoveredVisits = coverageVisits.filter((visit) => !visit.assignedCarerId).length;
  const replacementVisits = coverageVisits.filter(
    (visit) => visit.coverageStatus === "needs_replacement" || visit.status === "no_show"
  ).length;
  const nextCoverageVisit = coverageVisits[0];

  return (
    <ProviderShell
      currentSection="dashboard"
      title="Coordinator workspace"
      subtitle="Coordinate coverage, support carers, review completed visits and prepare operational closing."
    >
      <section className="coordinator-board">
        <section className="coordinator-hero-grid">
          <article className="coordinator-focus-card">
            <div className="focus-card-copy">
              <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
              <div>
                <p className="card-tag">Next best action</p>
                <h2>
                  {nextCoverageVisit
                    ? `Arrange coverage for ${nextCoverageVisit.recipientName}`
                    : "Coverage is stable right now"}
                </h2>
                <p>
                  {nextCoverageVisit
                    ? `${nextCoverageVisit.orderCode} is scheduled ${formatDateTime(
                        nextCoverageVisit.scheduledStart
                      )}. ${nextCoverageVisit.assignedCarerName ?? "No carer is assigned yet."}`
                    : "No uncovered or replacement visits need immediate coordination."}
                </p>
              </div>
            </div>
            <div className="focus-card-actions">
              {nextCoverageVisit ? (
                <Link className="primary-link" href={`/providers/orders/${nextCoverageVisit.orderId}`}>
                  Open request
                </Link>
              ) : (
                <Link className="primary-link" href="/providers/orders">
                  Review requests
                </Link>
              )}
              <Link className="ghost-link" href="/providers/orders?risk=critical">
                View critical
              </Link>
            </div>
          </article>

          <aside className="coordinator-today-card">
            <div className="split-row">
              <div>
                <p className="card-tag">Today</p>
                <h2>{todayVisits.length} visits</h2>
              </div>
              <span className="metric-icon metric-icon-today" aria-hidden="true" />
            </div>
            <div className="today-rhythm">
              {todayVisits.length > 0 ? (
                todayVisits.slice(0, 4).map((visit) => (
                  <Link className="today-rhythm-item" href={`/providers/orders/${visit.orderId}`} key={visit.id}>
                    <span>{getVisitTime(visit.scheduledStart)}</span>
                    <strong>{visit.recipientName}</strong>
                    <small>{visit.assignedCarerName ?? "Unassigned"}</small>
                  </Link>
                ))
              ) : (
                <p className="panel-copy">No visits are scheduled for today.</p>
              )}
            </div>
          </aside>
        </section>

        <section className="coordinator-widget-strip" aria-label="Coordinator status">
          <Link className="coordinator-widget" href="/providers/orders">
            <span className="metric-icon metric-icon-visits" aria-hidden="true" />
            <div>
              <strong>{activeOrders.length}</strong>
              <p>service requests</p>
            </div>
          </Link>
          <a className="coordinator-widget coordinator-widget-critical" href="#coverage-work">
            <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
            <div>
              <strong>{coverageVisits.length}</strong>
              <p>coverage actions</p>
            </div>
          </a>
          <a className="coordinator-widget coordinator-widget-warning" href="#care-team">
            <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
            <div>
              <strong>{credentialAlerts}</strong>
              <p>credential alerts</p>
            </div>
          </a>
          <Link className="coordinator-widget coordinator-widget-positive" href="/providers/closing">
            <span className="metric-icon metric-icon-today" aria-hidden="true" />
            <div>
              <strong>{closingVisits.length}</strong>
              <p>ready to close</p>
            </div>
          </Link>
        </section>

        <section className="coordinator-section" id="coverage-work">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Coverage</p>
              <h2>Visits needing coordination</h2>
            </div>
            <div className="coverage-counts">
              <span>{uncoveredVisits} unassigned</span>
              <span>{replacementVisits} replacement</span>
            </div>
          </div>
          <div className="coverage-card-grid">
            {coverageVisits.length > 0 ? (
              coverageVisits.slice(0, 6).map((visit) => (
                <Link className="coverage-work-card" href={`/providers/orders/${visit.orderId}`} key={visit.id}>
                  <div className="coverage-card-icon">
                    <span className="metric-icon metric-icon-readiness" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="split-row">
                      <strong>{visit.recipientName}</strong>
                      <StatusBadge value={visit.coverageStatus} />
                    </div>
                    <p>
                      {visit.orderCode} / {formatDateTime(visit.scheduledStart)}
                    </p>
                    <p>{visit.assignedCarerName ?? "Assign a carer before the service window."}</p>
                  </div>
                  <span className={`risk-pill risk-${getPriorityTone(visit.orderPriority)}`}>
                    {visit.orderPriority}
                  </span>
                </Link>
              ))
            ) : (
              <div className="empty-state-card">
                <span className="metric-icon metric-icon-visits" aria-hidden="true" />
                <strong>All visits are covered</strong>
                <p>No scheduled visit is waiting for assignment or replacement.</p>
              </div>
            )}
          </div>
        </section>

        <section className="coordinator-section" id="care-team">
          <div className="section-title-row">
            <div>
              <p className="card-tag">Care team</p>
              <h2>Availability and credentials</h2>
            </div>
            <div className="coverage-counts">
              <span>{readyCarers.length} ready</span>
              <span>{carersNeedingAttention.length} attention</span>
            </div>
          </div>
          <div className="carer-pulse-grid">
            {rosterCarers.slice(0, 6).map((carer) => (
              <article className="carer-pulse-card" key={carer.id}>
                <div className="carer-avatar" aria-hidden="true">
                  {carer.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="carer-pulse-main">
                  <div className="split-row">
                    <strong>{carer.name}</strong>
                    <StatusBadge value={carer.readinessStatus} />
                  </div>
                  <p>{carer.readinessSummary}</p>
                  <div className="carer-mini-metrics">
                    <span>{carer.activeVisitCount} visits</span>
                    <span>{carer.workingBlockCount} working blocks</span>
                    <span>{carer.credentialAlertCount} alerts</span>
                  </div>
                </div>
                <div className="carer-contact-actions">
                  {carer.email ? (
                    <a
                      className="icon-action icon-action-email"
                      href={`mailto:${carer.email}`}
                      aria-label={`Email ${carer.name}`}
                    />
                  ) : null}
                  {carer.phone ? (
                    <a
                      className="icon-action icon-action-phone"
                      href={`tel:${carer.phone}`}
                      aria-label={`Call ${carer.name}`}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="coordinator-lower-grid">
          <article className="coordinator-section">
            <div className="section-title-row">
              <div>
                <p className="card-tag">Review</p>
                <h2>Completed work</h2>
              </div>
              <Link className="inline-link" href="/providers/orders?visitStatus=under_review">
                Open review queue
              </Link>
            </div>
            <div className="completion-widget-row">
              <Link className="completion-widget" href="/providers/orders?visitStatus=under_review">
                <span className="metric-icon metric-icon-credentials" aria-hidden="true" />
                <strong>{reviewVisits.length}</strong>
                <p>waiting for review</p>
              </Link>
              <Link className="completion-widget" href="/providers/closing">
                <span className="metric-icon metric-icon-today" aria-hidden="true" />
                <strong>{closingVisits.length}</strong>
                <p>approved for closing</p>
              </Link>
            </div>
            <div className="review-story-list">
              {reviewVisits.length > 0 ? (
                reviewVisits.slice(0, 3).map((visit) => (
                  <Link className="review-story-card" href={`/providers/orders/${visit.orderId}`} key={visit.id}>
                    <strong>
                      {visit.orderCode} - {visit.recipientName}
                    </strong>
                    <p>
                      {visit.assignedCarerName ?? "No carer"} submitted {visit.checklistCompletion}% checklist and{" "}
                      {visit.evidenceCount} evidence file{visit.evidenceCount === 1 ? "" : "s"}.
                    </p>
                  </Link>
                ))
              ) : (
                <p className="panel-copy">No visits are waiting for provider review.</p>
              )}
            </div>
          </article>

          <article className="coordinator-section">
            <div className="section-title-row">
              <div>
                <p className="card-tag">Requests</p>
                <h2>Priority queue</h2>
              </div>
              <Link className="inline-link" href="/providers/orders">
                View all
              </Link>
            </div>
            <div className="priority-request-stack">
              {prioritizedOrders.map((order) => (
                <Link className="priority-request-card" href={`/providers/orders/${order.id}`} key={order.id}>
                  <div>
                    <strong>{order.code}</strong>
                    <p>{order.recipientName}</p>
                  </div>
                  <div>
                    <span className={`risk-pill risk-${order.coverageRisk}`}>{order.coverageRisk}</span>
                    <p>{order.pendingAction}</p>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </section>
    </ProviderShell>
  );
}
