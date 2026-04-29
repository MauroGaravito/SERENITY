import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_ROLES, requireOrganizationUser } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/admin-data";
import { createCareTeamMember } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminCareTeamPage() {
  const session = await requireOrganizationUser(ADMIN_ROLES);
  const workspace = await getAdminWorkspace(session.organizationId);

  return (
    <AdminShell
      currentSection="care-team"
      title="Care team"
      subtitle="Carers vinculados a Serenity, contacto, disponibilidad y credenciales."
    >
      <section className="ops-two-column admin-management-grid">
        <form action={createCareTeamMember} className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">New carer</p>
              <h2>Add care team member</h2>
              <p className="panel-copy">
                Carers belong to the provider. Today Serenity supports employee and independent
                carers; permanent/casual can be added as a later policy field.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>First name</span>
              <input name="firstName" placeholder="Gabriel" required />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" placeholder="Ramirez" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" placeholder="gabriel@serenity.local" required type="email" />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" placeholder="+57 300 000 0000" required />
            </label>
            <label>
              <span>Relationship</span>
              <select name="kind" defaultValue="INDEPENDENT">
                <option value="INDEPENDENT">Independent</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </label>
            <label>
              <span>Language</span>
              <input name="primaryLanguage" placeholder="Spanish" />
            </label>
            <label>
              <span>Business name</span>
              <input name="businessName" placeholder="Gabriel Ramirez Care Services" />
            </label>
            <label>
              <span>Tax id</span>
              <input name="taxId" placeholder="CC or NIT" />
            </label>
            <label className="form-grid-span-2">
              <span>Availability note</span>
              <input name="availabilityNote" placeholder="Available weekday mornings" />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-link" type="submit">
              Add carer
            </button>
          </div>
        </form>

        <section className="ops-panel">
          <div className="panel-heading">
            <div>
              <p className="card-tag">Care team summary</p>
              <h2>{workspace.stats.carers} carers</h2>
              <p className="panel-copy">
                Mauricio can see who belongs to Serenity and how to contact them before assignment.
              </p>
            </div>
          </div>
          <div className="metrics-grid metrics-grid-3">
            <article className="metric-card">
              <span>Active</span>
              <strong>{workspace.carers.filter((carer) => carer.isActive).length}</strong>
              <p>Available in matching.</p>
            </article>
            <article className="metric-card">
              <span>Employees</span>
              <strong>{workspace.carers.filter((carer) => carer.kind === "EMPLOYEE").length}</strong>
              <p>Internal team.</p>
            </article>
            <article className="metric-card">
              <span>Independents</span>
              <strong>
                {workspace.carers.filter((carer) => carer.kind === "INDEPENDENT").length}
              </strong>
              <p>External carers.</p>
            </article>
          </div>
        </section>
      </section>

      <section className="ops-panel">
        <div className="panel-heading">
          <div>
            <p className="card-tag">Roster pool</p>
            <h2>People Mauricio can coordinate</h2>
            <p className="panel-copy">
              This view answers whether carers work for Serenity: they are attached to the
              provider and can be contacted from the coordination workflow.
            </p>
          </div>
        </div>

        <div className="admin-care-grid">
          {workspace.carers.map((carer) => {
            const invalidCredentials = carer.credentials.filter(
              (credential) => credential.status !== "VALID"
            );

            return (
              <article className="care-team-card" key={carer.id}>
                <div className="care-team-card-head">
                  <div>
                    <h3>
                      {carer.firstName} {carer.lastName}
                    </h3>
                    <p>{carer.kind === "EMPLOYEE" ? "Employee" : "Independent"}</p>
                  </div>
                  <span className={`status-pill ${carer.isActive ? "" : "status-muted"}`}>
                    {carer.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="admin-contact-grid">
                  <span>{carer.email ?? "No email"}</span>
                  <span>{carer.phone}</span>
                  <span>{carer.primaryLanguage ?? "No language set"}</span>
                </div>
                <p>{carer.availabilityNote ?? "No availability note yet."}</p>
                <div className="carer-mini-metrics">
                  <span>{carer.credentials.length} credentials</span>
                  <span>{invalidCredentials.length} alerts</span>
                  <span>{carer.availabilityBlocks.length} blocks</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
