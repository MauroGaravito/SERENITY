import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

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

        <div className="admin-service-grid">
          {workspace.serviceTypes.map((serviceType) => {
            const template = serviceType.checklistTemplates[0];

            return (
              <article className="admin-service-card" key={serviceType.id}>
                <div className="admin-client-head">
                  <div>
                    <p className="card-tag">{serviceType.code}</p>
                    <h3>{serviceType.name}</h3>
                    <p>{serviceType.defaultDurationMin} min default duration</p>
                  </div>
                  <span className="status-pill">Active</span>
                </div>
                <div className="admin-mini-list">
                  {(template?.items ?? []).map((item) => (
                    <span key={item.id}>
                      {item.label}
                      {item.isRequired ? " / required" : ""}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
