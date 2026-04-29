import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

function formatDurationHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
}

export default async function AdminWorkflowsPage() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  const workspace = await getAdminWorkspace(session.organizationId);

  return (
    <AdminShell
      currentSection="workflows"
      title="Service workflows"
      subtitle="Servicios, duracion y care record esperado para cada tipo de visita."
    >
      <section className="workflow-focus-card admin-focus-card">
        <div>
          <p className="card-tag">Workflow design</p>
          <h2>From configured service to completed care record</h2>
          <p>
            Admin defines what can be requested. Coordinator schedules and assigns it. Carer
            completes the visit record. Reviewer approves the result for closing.
          </p>
          <p>
            Current MVP policy: service workflows are controlled catalog data. Admin can review
            what exists; visual create/edit is intentionally deferred until the workflow model is
            stable.
          </p>
        </div>
        <div className="workflow-focus-actions">
          <span
            className={`status-pill ${
              workspace.stats.servicesWithoutChecklist === 0 ? "" : "status-warning"
            }`}
          >
            {workspace.stats.servicesWithoutChecklist === 0
              ? "Care records ready"
              : `${workspace.stats.servicesWithoutChecklist} need checklist`}
          </span>
        </div>
      </section>

      <section className="workflow-stepper admin-stepper">
        {[
          ["Configure", "Client, site, recipient, care team and service type."],
          ["Request", "Coordinator creates a service request from configured data."],
          ["Coordinate", "Visit schedule, carer assignment and coverage decisions."],
          ["Execute", "Carer submits checklist, evidence, incidents and expenses."],
          ["Review", "Reviewer approves care record before closing and export."]
        ].map(([title, copy], index) => (
          <article className="workflow-step-card" key={title}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Service catalog</p>
            <h2>{workspace.serviceTypes.length} services configured</h2>
            <p className="panel-copy">
              These service types drive the order form and the expected care record after a visit.
            </p>
          </div>
        </div>

        {workspace.serviceTypes.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No service workflows configured</strong>
            <p>
              Add service types before centers can request care and before carers know what care
              record they must complete.
            </p>
          </div>
        ) : (
          <div className="admin-service-grid">
            {workspace.serviceTypes.map((serviceType) => {
            const template = serviceType.checklistTemplates[0];

            return (
              <article className="admin-service-card" key={serviceType.id}>
                <div className="admin-client-head">
                  <div>
                    <p className="card-tag">{serviceType.code}</p>
                    <h3>{serviceType.name}</h3>
                    <p>{formatDurationHours(serviceType.defaultDurationMin)} default duration</p>
                  </div>
                  <span className={`status-pill ${template ? "" : "status-warning"}`}>
                    {template ? "Care record" : "Needs checklist"}
                  </span>
                </div>
                {template ? (
                  <div className="admin-mini-list">
                    {template.items.map((item) => (
                      <span key={item.id}>
                        {item.label}
                        {item.isRequired ? " / required" : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="panel-copy">No checklist template is attached to this service.</p>
                )}
              </article>
            );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
