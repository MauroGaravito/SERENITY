import Link from "next/link";
import { CenterShell } from "@/components/centers/center-shell";
import { StatusBadge } from "@/components/providers/status-badge";
import { CENTER_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getCenterMetrics, getCenterPortalData, listCenterOrders } from "@/lib/centers-data";

export const dynamic = "force-dynamic";

export default async function CentersPage() {
  const session = await requireOrganizationUser(CENTER_ROLES);
  const centerId = session.organizationId;
  const [portal, metrics, orders] = await Promise.all([
    getCenterPortalData(centerId, session.userId),
    getCenterMetrics(centerId),
    listCenterOrders(centerId)
  ]);
  const recentOrders = orders.slice(0, 3);

  return (
    <CenterShell
      title={portal.name}
      subtitle={`${portal.managerName} manages center-side demand, sites and patient context. Serenity owns coverage, review and closing.`}
    >
      <section className="center-portal-hero">
        <article className="ops-panel center-identity-card">
          <div>
            <p className="card-tag">Center</p>
            <h2>{portal.legalName}</h2>
            <p className="panel-copy">
              Managed by {portal.managerName} / {portal.managerEmail}
            </p>
          </div>
          <div className="center-identity-grid">
            <div>
              <span>Provider partner</span>
              <strong>{portal.providerName}</strong>
            </div>
            <div>
              <span>Configured sites</span>
              <strong>{portal.sites.length}</strong>
            </div>
            <div>
              <span>Patients</span>
              <strong>{portal.recipients.length}</strong>
            </div>
            <div>
              <span>Active requests</span>
              <strong>{orders.length}</strong>
            </div>
          </div>
        </article>

        <article className="ops-panel center-next-card">
          <p className="card-tag">Next action</p>
          <h2>{orders.length > 0 ? "Monitor submitted requests" : "Create the first request"}</h2>
          <p className="panel-copy">
            {orders.length > 0
              ? "Review coverage, incidents and approved outcomes for requests submitted by this center."
              : `${portal.recipients[0]?.name ?? "The first patient"} and ${portal.sites[0]?.name ?? "the first site"} are configured. ${portal.managerName} can submit demand without creating provider master data.`}
          </p>
          <Link className="primary-link" href="/centers/orders">
            {orders.length > 0 ? "Open requests" : "Start request"}
          </Link>
        </article>
      </section>

      <section className="metrics-grid metrics-grid-4">
        {metrics.map((metric) => (
          <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className="center-directory-grid">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Sites</p>
              <h2>Configured center sites</h2>
            </div>
          </div>
          <div className="center-directory-list">
            {portal.sites.map((site) => (
              <div className="center-directory-row" key={site.id}>
                <span className="metric-icon metric-icon-today" aria-hidden="true" />
                <div>
                  <strong>{site.name}</strong>
                  <p>
                    {site.address} / {site.suburb}, {site.state}
                  </p>
                </div>
                <div className="center-directory-meta">
                  <span>{site.recipientsCount} patients</span>
                  <span>{site.activeOrdersCount} active requests</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Patients</p>
              <h2>Available request context</h2>
            </div>
          </div>
          <div className="center-directory-list">
            {portal.recipients.map((recipient) => (
              <div className="center-directory-row" key={recipient.id}>
                <span className="metric-icon metric-icon-visits" aria-hidden="true" />
                <div>
                  <strong>{recipient.name}</strong>
                  <p>
                    {recipient.siteName} / {recipient.notes}
                  </p>
                </div>
                <div className="center-directory-meta">
                  <span>{recipient.activeOrdersCount} active requests</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="ops-two-column center-requests-grid">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Requests</p>
              <h2>Orders submitted by {portal.name}</h2>
            </div>
            <Link className="inline-link" href="/centers/orders">
              Open all orders
            </Link>
          </div>
          <div className="order-rows">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <Link className="order-row" href={`/centers/orders/${order.id}`} key={order.id}>
                  <div>
                    <strong>
                      {order.code} / {order.title}
                    </strong>
                    <p>
                      {order.recipientName} / {order.facilityName}
                    </p>
                  </div>
                  <div className="order-row-meta">
                    <StatusBadge value={order.status} />
                    <span className={`risk-pill risk-${order.coverageRisk}`}>
                      {order.coverageRisk} risk
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state-card">
                <span className="metric-icon metric-icon-visits" aria-hidden="true" />
                <strong>No service requests yet</strong>
                <p>{portal.managerName} can create the first request from the orders workspace.</p>
                <Link className="primary-link" href="/centers/orders">
                  Create request
                </Link>
              </div>
            )}
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Role boundary</p>
              <h2>Who owns each step</h2>
            </div>
          </div>
          <div className="sequence-list">
            <div>
              <strong>1. Center defines the demand</strong>
              <p>The center selects patient, site, timing, service type and request notes.</p>
            </div>
            <div>
              <strong>2. Provider owns coverage</strong>
              <p>Mauricio assigns carers from Serenity and resolves coverage risk.</p>
            </div>
            <div>
              <strong>3. Center follows outcomes</strong>
              <p>The center monitors coverage, incidents and approved outcomes in its own scope.</p>
            </div>
            <div>
              <strong>4. Changes become requests</strong>
              <p>After provider coverage starts, center edits should become change notes instead of direct operational changes.</p>
            </div>
          </div>
        </article>
      </section>
    </CenterShell>
  );
}
