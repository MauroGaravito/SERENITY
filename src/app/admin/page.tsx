import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  const workspace = await getAdminWorkspace(session.organizationId);
  const hasClients = workspace.stats.clients > 0;
  const hasRecipients = workspace.stats.recipients > 0;
  const hasCarers = workspace.stats.carers > 0;

  const setupSteps = [
    {
      label: "Client network",
      title: "Create centers and sites",
      copy: "Register the centers Serenity serves, their sites, and the center contact.",
      done: hasClients
    },
    {
      label: "Recipients",
      title: "Add people receiving care",
      copy: "Attach patients or residents to the site where requests will originate.",
      done: hasRecipients
    },
    {
      label: "Care team",
      title: "Prepare carers",
      copy: "Keep contact, employment type, availability and credential readiness visible.",
      done: hasCarers
    },
    {
      label: "Service workflow",
      title: "Use configured services",
      copy: "Service types and checklist templates define what a visit must capture.",
      done: workspace.serviceTypes.length > 0
    }
  ];

  return (
    <AdminShell
      currentSection="overview"
      title="Admin workspace"
      subtitle="Define la red operativa antes de que Mauricio coordine solicitudes."
    >
      <section className="workflow-focus-card admin-focus-card">
        <div>
          <p className="card-tag">Provider setup</p>
          <h2>{workspace.provider.displayName}</h2>
          <p>
            Administra clientes, sedes, pacientes, carers y servicios. El coordinador entra
            despues para crear solicitudes, asignar cobertura y cerrar visitas.
          </p>
        </div>
        <div className="workflow-focus-actions">
          <Link className="primary-link" href="/admin/clients">
            Add client
          </Link>
          <Link className="ghost-link" href="/providers">
            Coordinator view
          </Link>
        </div>
      </section>

      <section className="metrics-grid metrics-grid-4">
        <article className="metric-card">
          <span>Clients</span>
          <strong>{workspace.stats.clients}</strong>
          <p>Centers linked to Serenity.</p>
        </article>
        <article className="metric-card">
          <span>Sites</span>
          <strong>{workspace.stats.facilities}</strong>
          <p>Operational locations.</p>
        </article>
        <article className="metric-card">
          <span>Recipients</span>
          <strong>{workspace.stats.recipients}</strong>
          <p>People available for new requests.</p>
        </article>
        <article className="metric-card">
          <span>Care team</span>
          <strong>{workspace.stats.carers}</strong>
          <p>{workspace.stats.credentialAlerts} credential alerts.</p>
        </article>
      </section>

      <section className="ops-panel admin-setup-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Setup flow</p>
            <h2>Before service requests</h2>
            <p className="panel-copy">
              This is the missing administrative layer: no order should be created until the
              client, site, recipient and available team are clear.
            </p>
          </div>
        </div>
        <div className="workflow-stepper admin-stepper">
          {setupSteps.map((step, index) => (
            <article
              className={`workflow-step-card ${step.done ? "is-complete" : "is-current"}`}
              key={step.label}
            >
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
              <small>{step.done ? "Ready" : "Needs setup"}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-two-column">
        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Role boundary</p>
              <h2>Who does what</h2>
            </div>
          </div>
          <div className="admin-role-list">
            <div>
              <strong>Admin</strong>
              <p>Creates clients, sites, carers, center contacts and service workflows.</p>
            </div>
            <div>
              <strong>Coordinator</strong>
              <p>Creates service requests, schedules visits, assigns carers and resolves coverage.</p>
            </div>
            <div>
              <strong>Reviewer</strong>
              <p>Checks completed visit records, evidence, incidents and approval decisions.</p>
            </div>
            <div>
              <strong>Center manager</strong>
              <p>Represents the client site and requests or follows care for their recipients.</p>
            </div>
            <div>
              <strong>Carer</strong>
              <p>Maintains availability and credentials, executes visits and submits the care record.</p>
            </div>
          </div>
        </article>

        <article className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Next action</p>
              <h2>Start from the client</h2>
              <p className="panel-copy">
                The Colombia seed now starts with Niquia, Rosalba and no service orders.
              </p>
            </div>
          </div>
          <div className="admin-action-list">
            <Link className="dashboard-filter-chip" href="/admin/clients">
              Manage clients and recipients
            </Link>
            <Link className="dashboard-filter-chip" href="/admin/care-team">
              Review carers and credentials
            </Link>
            <Link className="dashboard-filter-chip" href="/admin/workflows">
              Review service workflows
            </Link>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
